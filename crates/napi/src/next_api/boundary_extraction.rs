use std::collections::HashSet;

use anyhow::Result;
use next_api::{operation::OptionEndpoint, route::Endpoint};
use next_core::next_client_reference::ClientReferenceType;
use swc_core::{
    common::{FileName, SourceMap, Span},
    ecma::{
        ast::*,
        parser::{Parser, StringInput, Syntax, TsSyntax, lexer::Lexer},
        visit::{Visit, VisitWith},
    },
};
use turbo_tasks::{OperationVc, Vc, trace::TraceRawVcs};
use turbopack_core::{asset::AssetContent, module::Module, source::Source};

/// Location information for a JSX element in the source code
#[derive(Clone, TraceRawVcs)]
pub struct JsxElementLocation {
    pub file: String,
    pub line: u32,
    pub column: u32,
    pub span_start: u32,
    pub span_end: u32,
}

/// Simple boundary data that can be used within Turbo Tasks context
#[derive(Clone, TraceRawVcs)]
pub struct SimpleBoundaryData {
    pub server_file: String,
    pub client_file: String,
    pub local_name: String,
    pub jsx_location: Option<JsxElementLocation>,
}

/// Visitor to find JSX elements matching a specific component name
struct JsxFinder {
    target_name: String,
    found_location: Option<Span>,
    source_map: std::sync::Arc<SourceMap>,
}

impl Visit for JsxFinder {
    fn visit_jsx_element(&mut self, node: &JSXElement) {
        // Only capture first occurrence
        if self.found_location.is_some() {
            return;
        }

        // Check if opening element matches target name
        if let JSXElementName::Ident(ident) = &node.opening.name {
            if ident.sym.as_ref() == self.target_name {
                self.found_location = Some(node.span);
            }
        }

        // Continue visiting children
        node.visit_children_with(self);
    }

    fn visit_jsx_fragment(&mut self, node: &JSXFragment) {
        // Continue visiting children of fragments
        node.visit_children_with(self);
    }
}

/// Find the JSX element location where a client component is used in a server component
async fn find_jsx_usage_location(
    server_file_path: &str,
    client_local_name: &str,
) -> Result<Option<JsxElementLocation>> {
    // Read the source file directly from disk
    let source_str = match std::fs::read_to_string(server_file_path) {
        Ok(content) => content,
        Err(_) => {
            // If we can't read the file, skip JSX location extraction
            return Ok(None);
        }
    };

    // Parse the source with SWC
    let source_map = std::sync::Arc::new(SourceMap::default());
    let source_file = source_map.new_source_file(
        std::sync::Arc::new(FileName::Custom(server_file_path.to_string())),
        source_str.to_string(),
    );

    let syntax = Syntax::Typescript(TsSyntax {
        tsx: true,
        decorators: true,
        ..Default::default()
    });

    let lexer = Lexer::new(
        syntax,
        Default::default(),
        StringInput::from(&*source_file),
        None,
    );

    let mut parser = Parser::new_from(lexer);
    let module = match parser.parse_module() {
        Ok(m) => m,
        Err(_) => {
            // If parsing fails, just return None - don't block boundary detection
            return Ok(None);
        }
    };

    // Visit the AST to find JSX elements
    let mut visitor = JsxFinder {
        target_name: client_local_name.to_string(),
        found_location: None,
        source_map: source_map.clone(),
    };

    module.visit_with(&mut visitor);

    // If we found a location, extract line/column information
    if let Some(span) = visitor.found_location {
        let start_loc = source_map.lookup_char_pos(span.lo);

        return Ok(Some(JsxElementLocation {
            file: server_file_path.to_string(),
            line: (start_loc.line as u32),
            column: (start_loc.col.0 as u32),
            span_start: (span.lo.0 as u32),
            span_end: (span.hi.0 as u32),
        }));
    }

    Ok(None)
}

/// Extract boundary information from an endpoint using the existing client_references computation
/// This leverages Next.js's internal ClientReferenceGraphResult which is already computed
/// Returns simple data that can be used within Turbo Tasks context
pub async fn extract_boundaries_internal(
    endpoint_op: OperationVc<OptionEndpoint>,
) -> Result<Vec<SimpleBoundaryData>> {
    let endpoint = endpoint_op.connect().await?;

    if endpoint.is_none() {
        return Ok(vec![]);
    }

    let endpoint = endpoint.unwrap();

    // Access client_references through the Endpoint trait
    let endpoint_vc: Vc<Box<dyn Endpoint>> = *endpoint;
    let client_references = endpoint_vc.client_references().await?;

    let mut boundaries = Vec::new();
    let mut seen = HashSet::new();

    for client_ref in &client_references.client_references {
        // We only care about Ecmascript client references for now (not CSS)
        if let ClientReferenceType::EcmascriptClientReference(client_module) = client_ref.ty {
            // Get the server component path (if any)
            let server_file = if let Some(server_comp) = client_ref.server_component {
                let server_module = Vc::upcast::<Box<dyn Module>>(*server_comp);
                let server_ident = server_module.ident().await?;
                server_ident.path.path.to_string()
            } else {
                "<unknown>".to_string()
            };

            // Get the client module path
            let client_module_vc = Vc::upcast::<Box<dyn Module>>(*client_module);
            let client_ident = client_module_vc.ident().await?;
            let client_file = client_ident.path.path.to_string();

            // Get the local name (export name) from the client module
            let local_name = extract_export_name(&client_file);

            // Filter out unwanted boundaries
            // Skip if server is unknown
            if server_file == "<unknown>" {
                continue;
            }

            // Skip if either file is a Next.js internal component
            if is_nextjs_internal(&server_file) || is_nextjs_internal(&client_file) {
                continue;
            }

            // Create a unique key for deduplication
            let boundary_key = (server_file.clone(), client_file.clone(), local_name.clone());

            // Skip if we've already seen this boundary
            if !seen.insert(boundary_key) {
                continue;
            }

            // Find JSX usage location in server component
            let jsx_location = if server_file != "<unknown>" {
                find_jsx_usage_location(&server_file, &local_name)
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            boundaries.push(SimpleBoundaryData {
                server_file,
                client_file,
                local_name,
                jsx_location,
            });
        }
    }

    Ok(boundaries)
}

/// Extract a simple component name from a file path
fn extract_export_name(path: &str) -> String {
    let path = path.replace('\\', "/");
    let filename = path.rsplit('/').next().unwrap_or("Component");

    // Strip common extensions
    let name = filename
        .strip_suffix(".tsx")
        .or_else(|| filename.strip_suffix(".ts"))
        .or_else(|| filename.strip_suffix(".jsx"))
        .or_else(|| filename.strip_suffix(".js"))
        .unwrap_or(filename);

    // Handle index files by using parent directory name
    if name == "index" {
        path.rsplit('/').nth(1).unwrap_or("Component").to_string()
    } else {
        name.to_string()
    }
}

/// Check if a file path is a Next.js internal component
fn is_nextjs_internal(path: &str) -> bool {
    let normalized = path.replace('\\', "/");

    // Check for Next.js package paths
    if normalized.contains("packages/next/dist/") {
        return true;
    }

    // Check for Next.js built-in components
    if normalized.contains("/next/dist/") {
        return true;
    }

    // Check for node_modules next.js paths
    if normalized.contains("node_modules/next/") {
        return true;
    }

    false
}
