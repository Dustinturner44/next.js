use anyhow::Result;
use next_api::{operation::OptionEndpoint, route::Endpoint};
use next_core::next_client_reference::ClientReferenceType;
use turbo_tasks::{OperationVc, Vc, trace::TraceRawVcs};
use turbopack_core::module::Module;

/// Simple boundary data that can be used within Turbo Tasks context
#[derive(Clone, TraceRawVcs)]
pub struct SimpleBoundaryData {
    pub server_file: String,
    pub client_file: String,
    pub local_name: String,
}

/// Extract boundary information from an endpoint using the existing client_references computation
/// This leverages Next.js's internal ClientReferenceGraphResult which is already computed
/// Returns simple data that can be used within Turbo Tasks context
pub async fn extract_boundaries_internal(
    endpoint_op: OperationVc<OptionEndpoint>,
) -> Result<Vec<SimpleBoundaryData>> {
    eprintln!("[RUST] extract_boundaries_internal called");
    let endpoint = endpoint_op.connect().await?;

    if endpoint.is_none() {
        eprintln!("[RUST] endpoint is None");
        return Ok(vec![]);
    }

    let endpoint = endpoint.unwrap();
    eprintln!("[RUST] endpoint exists");

    // Access client_references through the Endpoint trait
    let endpoint_vc: Vc<Box<dyn Endpoint>> = *endpoint;
    let client_references = endpoint_vc.client_references().await?;

    eprintln!(
        "[RUST] Got {} client references",
        client_references.client_references.len()
    );

    let mut boundaries = Vec::new();

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

            eprintln!(
                "[RUST] Boundary: {} -> {} ({})",
                server_file, client_file, local_name
            );

            boundaries.push(SimpleBoundaryData {
                server_file,
                client_file,
                local_name,
            });
        }
    }

    eprintln!("[RUST] Total boundaries found: {}", boundaries.len());

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
