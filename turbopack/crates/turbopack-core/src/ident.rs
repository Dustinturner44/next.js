use std::{fmt::Write, mem::take};

use anyhow::Result;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use turbo_rcstr::RcStr;
use turbo_tasks::{NonLocalValue, TaskInput, TryJoinIterExt, Vc, trace::TraceRawVcs};
use turbo_tasks_fs::FileSystemPath;
use turbo_tasks_hash::{DeterministicHash, Xxh3Hash64Hasher, encode_hex, hash_xxh3_hash64};

use crate::resolve::ModulePart;

/// A layer identifies a distinct part of the module graph.
///
/// Construct a layer with `new_layer!` macro
#[derive(
    Copy,
    Clone,
    TaskInput,
    Hash,
    Debug,
    DeterministicHash,
    Eq,
    PartialEq,
    TraceRawVcs,
    Serialize,
    NonLocalValue,
)]
pub struct Layer {
    id: u8,
}

impl<'de> Deserialize<'de> for Layer {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let id = u8::deserialize(deserializer)?;
        // Check that id is a valid layer index
        if (id as usize) < LAYERS.len() {
            Ok(Layer { id })
        } else {
            Err(serde::de::Error::custom(format!(
                "Invalid Layer id {} (must be < {})",
                id,
                LAYERS.len()
            )))
        }
    }
}

/// A list of all layers sorted by name
static LAYERS: Lazy<Vec<LayerRegistration>> = Lazy::new(|| {
    let mut all_layers: Vec<_> = inventory::iter::<LayerRegistration>().copied().collect();
    all_layers.sort_by_key(|registration| registration.name);
    let mut prev: Option<&LayerRegistration> = None;
    for registration in all_layers.iter() {
        if let Some(prev) = prev
            && prev.name == registration.name
        {
            panic!(
                "duplicate layer definition, names should be unique: {prev:?}, {registration:?}"
            );
        }
        prev = Some(registration);
    }
    assert!(all_layers.len() <= u8::MAX as usize);
    all_layers
});

impl Layer {
    // Should be constructed by the `new_layer!` macro
    // that guarantees that the layer is registered so this will never panic.
    #[doc(hidden)]
    pub fn new(name: &'static str) -> Self {
        debug_assert!(!name.is_empty());
        let id = match LAYERS.binary_search_by_key(&name, |registration| registration.name) {
            // Safety: we know that the length of the layers is less than u8::MAX due to the assert
            // in LAYERS above
            Ok(id) => id as u8,
            Err(_) => panic!("layer not found: {name}, did you forget to call `new_layer!`?"),
        };

        Self { id }
    }

    /// Returns a user friendly name for this layer
    pub fn user_friendly_name(&self) -> &'static str {
        let r = &LAYERS[self.id as usize];
        r.user_friendly_name.unwrap_or(r.name)
    }

    pub fn name(&self) -> &'static str {
        LAYERS[self.id as usize].name
    }
}

#[doc(hidden)]
#[derive(Clone, Copy, Debug)]
pub struct LayerRegistration {
    pub name: &'static str,
    pub user_friendly_name: Option<&'static str>,
}

inventory::collect!(LayerRegistration);

#[macro_export]
macro_rules! new_layer {
    ($var:ident, $name:expr, $user_friendly_name:expr) => {
        turbo_tasks::macro_helpers::inventory_submit!($crate::ident::LayerRegistration {
            name: $name,
            user_friendly_name: Some($user_friendly_name)
        });
        static $var: ::turbo_tasks::macro_helpers::Lazy<$crate::ident::Layer> =
            ::turbo_tasks::macro_helpers::Lazy::new(|| $crate::ident::Layer::new($name));
    };
    ($var:ident, $name:expr) => {
        turbo_tasks::macro_helpers::inventory_submit!($crate::ident::LayerRegistration {
            name: $name,
            user_friendly_name: None
        });
        static $var: ::turbo_tasks::macro_helpers::Lazy<$crate::ident::Layer> =
            ::turbo_tasks::macro_helpers::Lazy::new(|| $crate::ident::Layer::new($name));
    };
}

/// An identifier for an asset.
///
/// This is used to identify any asset in turbopack but primarily files, modules and chunks.
///
/// There are many thousands of these instances in a large build so size is a concern, this struct
/// is optimized to be 64 bytes with a cheap `clone` implementation.
#[turbo_tasks::value(shared)]
#[derive(Clone, Debug, Hash, TaskInput)]
pub struct AssetIdent {
    /// The primary path of the asset
    pub path: FileSystemPath,
    /// The assets that are nested in this asset
    /// Formatted as a sequence of `key => asset` pairs
    pub assets: RcStr,
    /// The modifiers of this asset (e.g. `client chunks`) as a comma separated list
    pub modifiers: RcStr,
    /// The parts of the asset that are (ECMAScript) modules a list of <part> separated by
    /// whitespace.
    pub parts: RcStr,
    /// Combined metadata string containing query, fragment, and content_type
    /// Format: "{query}{fragment} <{content_type}>"
    /// - query: optional query string starting with '?' (e.g. "?foo=bar")
    /// - fragment: optional fragment string starting with '#' (e.g. "#section")
    /// - content_type: optional MIME type in angle brackets (e.g. " <text/html>")
    metadata: RcStr,
    /// Byte offset where query ends (0 if no query)
    #[serde(default)]
    metadata_query_end: u16,
    /// Byte offset where fragment ends (equals metadata_query_end if no fragment)
    /// If metadata_fragment_end < metadata.len(), then there's a content_type after it " <
    /// content_type >"
    #[serde(default)]
    metadata_fragment_end: u32,
    /// The asset layer the asset was created from.
    pub layer: Option<Layer>,
}

impl AssetIdent {
    /// Helper function to rebuild the metadata string from components
    fn rebuild_metadata(
        query: &str,
        fragment: &str,
        content_type: Option<&str>,
    ) -> (RcStr, u16, u32) {
        let query_len = query.len();
        let fragment_len = fragment.len();

        let mut result = String::with_capacity(
            // +3 for the " <" + ct + ">"
            query_len + fragment_len + content_type.map_or(0, |ct| ct.len() + 3),
        );
        result.push_str(query);
        result.push_str(fragment);
        if let Some(ct) = content_type {
            result.push_str(" <");
            result.push_str(ct);
            result.push('>');
        }

        (
            RcStr::from(result),
            query_len as u16,
            // The setters enforce that the query and fragment lengths are less than u16::MAX
            // so we can safely cast the sum into u32.
            (query_len + fragment_len) as u32,
        )
    }

    fn check_modifier_non_empty(modifier: &RcStr) {
        debug_assert!(!modifier.is_empty(), "modifiers cannot be empty.");
    }
    pub fn add_modifier(&mut self, modifier: RcStr) {
        if self.modifiers.is_empty() {
            Self::check_modifier_non_empty(&modifier);
            self.modifiers = modifier;
            return;
        }
        self.add_modifiers(std::iter::once(modifier));
    }

    pub fn add_modifiers(&mut self, new_modifiers: impl IntoIterator<Item = RcStr>) {
        let mut modifiers = take(&mut self.modifiers).into_owned();
        for modifier in new_modifiers {
            Self::check_modifier_non_empty(&modifier);
            if !modifiers.is_empty() {
                modifiers.push_str(", ");
            }
            modifiers.push_str(&modifier);
        }
        self.modifiers = RcStr::from(modifiers);
    }

    pub async fn add_asset(&mut self, key: RcStr, asset: &AssetIdent) -> Result<()> {
        let mut assets = take(&mut self.assets).into_owned();
        if !assets.is_empty() {
            assets.push_str(", ");
        }
        assets.push_str(&key);
        assets.push_str(" => ");
        assets.push_str(&asset.value_to_string().await?);

        self.assets = RcStr::from(assets);
        Ok(())
    }
    pub async fn add_assets(&mut self, items: Vec<(RcStr, Vc<AssetIdent>)>) -> Result<()> {
        debug_assert!(!items.is_empty(), "assets cannot be empty.");
        let mut assets = take(&mut self.assets).into_owned();

        // Execute all asset string conversions concurrently
        let asset_strings = items
            .into_iter()
            .map(|(key, asset)| async move {
                let asset_string = asset.await?.value_to_string().await?;
                Ok(format!("{key} => {asset_string}"))
            })
            .try_join()
            .await?;

        // Build the final assets string
        for asset_string in asset_strings {
            if !assets.is_empty() {
                assets.push_str(", ");
            }
            assets.push_str(&asset_string);
        }

        self.assets = RcStr::from(assets);
        Ok(())
    }

    pub fn add_part(&mut self, part: ModulePart) {
        if matches!(part, ModulePart::Facade) {
            // facade is not included in ident as switching between facade and non-facade
            // shouldn't change the ident
            return;
        }
        if self.parts.is_empty() {
            self.parts = RcStr::from(format!("<{}>", part.to_string()));
            return;
        }
        self.add_parts(std::iter::once(part));
    }

    pub fn add_parts(&mut self, new_parts: impl IntoIterator<Item = ModulePart>) {
        let mut parts = take(&mut self.parts).into_owned();
        for part in new_parts {
            if matches!(part, ModulePart::Facade) {
                // facade is not included in ident as switching between facade and non-facade
                // shouldn't change the ident
                continue;
            }
            if !parts.is_empty() {
                parts.push(' ');
            }
            parts.push('<');
            parts.push_str(&part.to_string());
            parts.push('>');
        }
        self.parts = RcStr::from(parts);
    }

    pub async fn rename_as_ref(&mut self, pattern: &str) -> Result<()> {
        let root = self.path.root().await?;
        self.path = root.join(&pattern.replace('*', &self.path.path))?;
        Ok(())
    }

    pub fn query(&self) -> &str {
        &self.metadata[..self.metadata_query_end as usize]
    }

    pub fn set_query(&mut self, query: RcStr) {
        debug_assert!(
            query.is_empty() || query.starts_with('?'),
            "query must be empty or start with '?'"
        );
        debug_assert!(
            query.len() <= u16::MAX as usize,
            "query length exceeds u16::MAX"
        );

        let (metadata, query_end, fragment_end) =
            Self::rebuild_metadata(&query, self.fragment(), self.content_type());
        self.metadata = metadata;
        self.metadata_query_end = query_end;
        self.metadata_fragment_end = fragment_end;
    }

    pub fn fragment(&self) -> &str {
        &self.metadata[self.metadata_query_end as usize..self.metadata_fragment_end as usize]
    }

    pub fn set_fragment(&mut self, fragment: RcStr) {
        debug_assert!(
            fragment.is_empty() || fragment.starts_with('#'),
            "fragment must be empty or start with '#'"
        );
        debug_assert!(
            fragment.len() <= u16::MAX as usize,
            "fragment length exceeds u16::MAX"
        );

        let (metadata, query_end, fragment_end) =
            Self::rebuild_metadata(self.query(), &fragment, self.content_type());
        self.metadata = metadata;
        self.metadata_query_end = query_end;
        self.metadata_fragment_end = fragment_end;
    }

    pub fn content_type(&self) -> Option<&str> {
        let fragment_end = self.metadata_fragment_end as usize;
        if fragment_end < self.metadata.len() {
            // Format is " <content_type>" so skip " <" and remove trailing ">"
            let content_part = &self.metadata[fragment_end..];
            if content_part.len() > 3
                && content_part.starts_with(" <")
                && content_part.ends_with('>')
            {
                Some(&content_part[2..content_part.len() - 1])
            } else {
                None
            }
        } else {
            None
        }
    }

    pub fn set_content_type(&mut self, content_type: &str) {
        debug_assert!(
            content_type.len() <= u16::MAX as usize,
            "content_type length exceeds u16::MAX"
        );

        let (metadata, query_end, fragment_end) =
            Self::rebuild_metadata(self.query(), self.fragment(), Some(content_type));
        self.metadata = metadata;
        self.metadata_query_end = query_end;
        self.metadata_fragment_end = fragment_end;
    }

    /// Creates an [AssetIdent] from a [FileSystemPath]
    pub fn from_path(path: FileSystemPath) -> Self {
        AssetIdent {
            path,
            assets: RcStr::default(),
            modifiers: RcStr::default(),
            parts: RcStr::default(),
            metadata: RcStr::default(),
            layer: None,
            metadata_query_end: 0,
            metadata_fragment_end: 0,
        }
    }

    pub async fn path(self: Vc<Self>) -> Result<FileSystemPath> {
        Ok(self.await?.path.clone())
    }
}

impl AssetIdent {
    /// Computes a unique output asset name for the given asset identifier.
    /// TODO(alexkirsz) This is `turbopack-browser` specific, as
    /// `turbopack-nodejs` would use a content hash instead. But for now
    /// both are using the same name generation logic.
    pub async fn output_name(
        &self,
        context_path: &FileSystemPath,
        prefix: Option<RcStr>,
        expected_extension: RcStr,
    ) -> Result<String> {
        debug_assert!(
            expected_extension.starts_with("."),
            "the extension should include the leading '.', got '{expected_extension}'"
        );
        // TODO(PACK-2140): restrict character set to A–Za–z0–9-_.~'()
        // to be compatible with all operating systems + URLs.

        // For clippy -- This explicit deref is necessary
        let path = &self.path;
        let mut name = if let Some(inner) = context_path.get_path_to(path) {
            clean_separators(inner)
        } else {
            clean_separators(&self.path.value_to_string().await?)
        };
        let removed_extension = name.ends_with(&*expected_extension);
        if removed_extension {
            name.truncate(name.len() - expected_extension.len());
        }
        // This step ensures that leading dots are not preserved in file names. This is
        // important as some file servers do not serve files with leading dots (e.g.
        // Next.js).
        let mut name = clean_additional_extensions(&name);
        if let Some(prefix) = prefix {
            name = format!("{prefix}-{name}");
        }

        let default_modifier = match expected_extension.as_str() {
            ".js" => Some("ecmascript"),
            ".css" => Some("css"),
            _ => None,
        };

        let mut hasher = Xxh3Hash64Hasher::new();
        let mut has_hash = false;
        let AssetIdent {
            path: _,
            assets,
            modifiers,
            parts,
            metadata: _,
            layer,
            metadata_query_end: _,
            metadata_fragment_end: _,
        } = self;
        // Hash the metadata string directly (contains query, fragment, and content_type)
        if !self.metadata.is_empty() {
            0_u8.deterministic_hash(&mut hasher);
            self.metadata.deterministic_hash(&mut hasher);
            has_hash = true;
        }
        if !assets.is_empty() {
            1_u8.deterministic_hash(&mut hasher);
            assets.deterministic_hash(&mut hasher);
            has_hash = true;
        }
        // If the only modifier is the default modifier, we don't need to hash it
        if !modifiers.is_empty()
            && let Some(default_modifier) = default_modifier
            && modifiers != default_modifier
        {
            2_u8.deterministic_hash(&mut hasher);
            modifiers.deterministic_hash(&mut hasher);
            has_hash = true;
        }
        if !parts.is_empty() {
            3_u8.deterministic_hash(&mut hasher);
            parts.deterministic_hash(&mut hasher);
            has_hash = true;
        }
        if let Some(layer) = layer {
            4_u8.deterministic_hash(&mut hasher);
            layer.deterministic_hash(&mut hasher);
            has_hash = true;
        }

        if has_hash {
            let hash = encode_hex(hasher.finish());
            let truncated_hash = &hash[..8];
            write!(name, "_{truncated_hash}")?;
        }

        // Location in "path" where hashed and named parts are split.
        // Everything before i is hashed and after i named.
        let mut i = 0;
        static NODE_MODULES: &str = "_node_modules_";
        if let Some(j) = name.rfind(NODE_MODULES) {
            i = j + NODE_MODULES.len();
        }
        const MAX_FILENAME: usize = 80;
        if name.len() - i > MAX_FILENAME {
            i = name.len() - MAX_FILENAME;
            if let Some(j) = name[i..].find('_')
                && j < 20
            {
                i += j + 1;
            }
        }
        if i > 0 {
            let hash = encode_hex(hash_xxh3_hash64(&name.as_bytes()[..i]));
            let truncated_hash = &hash[..5];
            name = format!("{}_{}", truncated_hash, &name[i..]);
        }
        // We need to make sure that `.json` and `.json.js` doesn't end up with the same
        // name. So when we add an extra extension when want to mark that with a "._"
        // suffix.
        if !removed_extension {
            name += "._";
        }
        name += &expected_extension;
        Ok(name)
    }

    /// Mimics `ValueToString::to_string`.
    pub fn value_to_string(&self) -> Vc<RcStr> {
        value_to_string(self.clone())
    }
}

#[turbo_tasks::function]

async fn value_to_string(ident: AssetIdent) -> Result<Vc<RcStr>> {
    let path = ident.path.value_to_string().await?;
    let mut s = String::with_capacity(
        path.len()
            + ident.metadata.len()
            + ident.parts.len()
            + if ident.assets.is_empty() {
                0
            } else {
                ident.assets.len() + 3
            }
            + if ident.modifiers.is_empty() {
                0
            } else {
                ident.modifiers.len() + 3
            }
            + ident.layer.map_or(0, |layer| layer.name().len() + 3),
    );
    s.push_str(&path);

    // The metadata string already contains query, fragment, and content_type formatted as:
    // "{query}{fragment} <{content_type}>" - just append it directly
    s.push_str(&ident.metadata);

    if !ident.assets.is_empty() {
        s.push_str(" {");
        s.push_str(&ident.assets);
        s.push_str(" }");
    }

    if let Some(layer) = &ident.layer {
        s.push_str(" [");
        s.push_str(layer.name());
        s.push(']');
    }

    if !ident.modifiers.is_empty() {
        s.push_str(" (");
        s.push_str(&ident.modifiers);
        s.push(')');
    }

    s.push_str(&ident.parts);

    Ok(Vc::cell(s.into()))
}

fn clean_separators(s: &str) -> String {
    static SEPARATOR_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"[/#?]").unwrap());
    SEPARATOR_REGEX.replace_all(s, "_").to_string()
}

fn clean_additional_extensions(s: &str) -> String {
    s.replace('.', "_")
}

// Re-export the macro in this module's namespace
pub use crate::new_layer;

#[cfg(test)]
mod tests {
    use turbo_rcstr::rcstr;
    use turbo_tasks_backend::{BackendOptions, TurboTasksBackend, noop_backing_storage};
    use turbo_tasks_fs::{FileSystem, VirtualFileSystem};

    use super::*;

    async fn create_test_asset_ident() -> AssetIdent {
        // Create a simple test path using VirtualFileSystem for testing
        let fs = VirtualFileSystem::new_with_name(rcstr!("test"));
        let path = fs.root().await.unwrap().join("test.js").unwrap();
        AssetIdent::from_path(path)
    }

    macro_rules! turbo_test {
        ($name:ident, $body:expr) => {
            #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
            async fn $name() {
                let tt = turbo_tasks::TurboTasks::new(TurboTasksBackend::new(
                    BackendOptions::default(),
                    noop_backing_storage(),
                ));
                tt.run_once(async { $body }).await.unwrap();
            }
        };
    }

    turbo_test!(test_query_operations, {
        let mut ident = create_test_asset_ident().await;

        // Initially should be empty
        assert_eq!(ident.query(), "");

        // Set a query parameter
        ident.set_query(rcstr!("?foo=bar"));
        assert_eq!(ident.query(), "?foo=bar");

        // Set a different query parameter
        ident.set_query(rcstr!("?baz=qux&hello=world"));
        assert_eq!(ident.query(), "?baz=qux&hello=world");

        // Clear query parameter
        ident.set_query(rcstr!(""));
        assert_eq!(ident.query(), "");

        anyhow::Ok(())
    });

    turbo_test!(test_fragment_operations, {
        let mut ident = create_test_asset_ident().await;

        // Initially should be empty
        assert_eq!(ident.fragment(), "");

        // Set a fragment
        ident.set_fragment(rcstr!("#section1"));
        assert_eq!(ident.fragment(), "#section1");

        // Set a different fragment
        ident.set_fragment(rcstr!("#header"));
        assert_eq!(ident.fragment(), "#header");

        // Clear fragment
        ident.set_fragment(rcstr!(""));
        assert_eq!(ident.fragment(), "");

        anyhow::Ok(())
    });

    turbo_test!(test_content_type_operations, {
        let mut ident = create_test_asset_ident().await;

        // Initially should be None
        assert_eq!(ident.content_type(), None);

        // Set a content type
        ident.set_content_type("text/html");
        assert_eq!(ident.content_type(), Some("text/html"));

        // Set a different content type
        ident.set_content_type("application/json");
        assert_eq!(ident.content_type(), Some("application/json"));

        // Set another content type
        ident.set_content_type("image/png");
        assert_eq!(ident.content_type(), Some("image/png"));

        anyhow::Ok(())
    });

    turbo_test!(test_combined_operations, {
        let mut ident = create_test_asset_ident().await;

        // Set query and fragment together
        ident.set_query(rcstr!("?param=value"));
        ident.set_fragment(rcstr!("#anchor"));

        assert_eq!(ident.query(), "?param=value");
        assert_eq!(ident.fragment(), "#anchor");
        assert_eq!(ident.content_type(), None);

        // Add content type
        ident.set_content_type("text/css");

        assert_eq!(ident.query(), "?param=value");
        assert_eq!(ident.fragment(), "#anchor");
        assert_eq!(ident.content_type(), Some("text/css"));

        // Change query while keeping fragment and content type
        ident.set_query(rcstr!("?new=param"));

        assert_eq!(ident.query(), "?new=param");
        assert_eq!(ident.fragment(), "#anchor");
        assert_eq!(ident.content_type(), Some("text/css"));

        // Change fragment while keeping query and content type
        ident.set_fragment(rcstr!("#new-section"));

        assert_eq!(ident.query(), "?new=param");
        assert_eq!(ident.fragment(), "#new-section");
        assert_eq!(ident.content_type(), Some("text/css"));

        // Change content type while keeping query and fragment
        ident.set_content_type("application/javascript");

        assert_eq!(ident.query(), "?new=param");
        assert_eq!(ident.fragment(), "#new-section");
        assert_eq!(ident.content_type(), Some("application/javascript"));

        anyhow::Ok(())
    });

    turbo_test!(test_metadata_format, {
        let mut ident = create_test_asset_ident().await;

        // Test that metadata string is formatted correctly
        ident.set_query(rcstr!("?test=1"));
        ident.set_fragment(rcstr!("#frag"));
        ident.set_content_type("text/plain");

        // The metadata should be: "?test=1#frag <text/plain>"
        assert_eq!(ident.metadata.as_str(), "?test=1#frag <text/plain>");
        assert_eq!(ident.metadata_query_end, 7); // Length of "?test=1"
        assert_eq!(ident.metadata_fragment_end, 12); // Length of "?test=1#frag"

        anyhow::Ok(())
    });

    turbo_test!(test_edge_cases, {
        let mut ident = create_test_asset_ident().await;

        // Test with only content type (no query or fragment)
        ident.set_content_type("application/xml");
        assert_eq!(ident.query(), "");
        assert_eq!(ident.fragment(), "");
        assert_eq!(ident.content_type(), Some("application/xml"));
        assert_eq!(ident.metadata.as_str(), " <application/xml>");

        // Test with only query
        let mut ident2 = create_test_asset_ident().await;
        ident2.set_query(rcstr!("?only=query"));
        assert_eq!(ident2.query(), "?only=query");
        assert_eq!(ident2.fragment(), "");
        assert_eq!(ident2.content_type(), None);

        // Test with only fragment
        let mut ident3 = create_test_asset_ident().await;
        ident3.set_fragment(rcstr!("#only-fragment"));
        assert_eq!(ident3.query(), "");
        assert_eq!(ident3.fragment(), "#only-fragment");
        assert_eq!(ident3.content_type(), None);

        // Test clearing all values
        ident.set_query(rcstr!(""));
        ident.set_fragment(rcstr!(""));
        // Note: there's no clear_content_type method, so we test by setting an empty one
        // An empty content type should still be stored as Some("")
        ident.set_content_type("");
        assert_eq!(ident.query(), "");
        assert_eq!(ident.fragment(), "");
        // Empty content type should be None when the content is empty
        assert_eq!(ident.content_type(), None);

        anyhow::Ok(())
    });

    turbo_test!(test_complex_values, {
        let mut ident = create_test_asset_ident().await;

        // Test with complex query parameters
        ident.set_query(rcstr!("?foo=bar&baz=qux%20encoded&array[]=1&array[]=2"));
        assert_eq!(
            ident.query(),
            "?foo=bar&baz=qux%20encoded&array[]=1&array[]=2"
        );

        // Test with complex fragment
        ident.set_fragment(rcstr!("#section-with-dashes_and_underscores.and.dots"));
        assert_eq!(
            ident.fragment(),
            "#section-with-dashes_and_underscores.and.dots"
        );

        // Test with complex content type
        ident.set_content_type("application/vnd.api+json; charset=utf-8");
        assert_eq!(
            ident.content_type(),
            Some("application/vnd.api+json; charset=utf-8")
        );

        // Verify all are preserved
        assert_eq!(
            ident.query(),
            "?foo=bar&baz=qux%20encoded&array[]=1&array[]=2"
        );
        assert_eq!(
            ident.fragment(),
            "#section-with-dashes_and_underscores.and.dots"
        );
        assert_eq!(
            ident.content_type(),
            Some("application/vnd.api+json; charset=utf-8")
        );

        anyhow::Ok(())
    });

    #[test]
    fn test_rebuild_metadata_helper() {
        // Test the internal rebuild_metadata function
        let (metadata, query_end, fragment_end) =
            AssetIdent::rebuild_metadata("?query=test", "#fragment", Some("text/html"));

        assert_eq!(metadata.as_str(), "?query=test#fragment <text/html>");
        assert_eq!(query_end, 11); // Length of "?query=test"
        assert_eq!(fragment_end, 20); // Length of "?query=test#fragment"

        // Test without content type
        let (metadata2, query_end2, fragment_end2) =
            AssetIdent::rebuild_metadata("?q=v", "#f", None);

        assert_eq!(metadata2.as_str(), "?q=v#f");
        assert_eq!(query_end2, 4); // Length of "?q=v"
        assert_eq!(fragment_end2, 6); // Length of "?q=v#f"

        // Test with empty values
        let (metadata3, query_end3, fragment_end3) =
            AssetIdent::rebuild_metadata("", "", Some("application/json"));

        assert_eq!(metadata3.as_str(), " <application/json>");
        assert_eq!(query_end3, 0);
        assert_eq!(fragment_end3, 0);
    }
}
