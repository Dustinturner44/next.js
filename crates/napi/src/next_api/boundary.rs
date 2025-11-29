use napi_derive::napi;

/// Root structure for boundary data passed from Turbopack to Next.js
#[napi(object)]
#[derive(Debug, Default)]
pub struct NapiBoundaryAnalysis {
    pub version: String,
    pub boundaries: Vec<NapiBoundary>,
    pub total_count: u32,
}

/// A single server→client boundary
#[napi(object)]
#[derive(Debug, Clone)]
pub struct NapiBoundary {
    pub id: String,
    pub server_file: String,
    pub client_file: String,
    pub import_info: NapiImportInfo,
    pub props: Vec<NapiProp>,
}

/// Information about the import statement
#[napi(object)]
#[derive(Debug, Clone)]
pub struct NapiImportInfo {
    pub local_name: String,
    pub import_location: NapiSourceLocation,
    pub import_statement: String,
}

/// A single prop passed to the client component
#[napi(object)]
#[derive(Debug, Clone)]
pub struct NapiProp {
    pub name: String,
    pub location: NapiSourceLocation,
    pub expression_raw: String,
    pub expression_type: String,
}

/// Location in source code
#[napi(object)]
#[derive(Debug, Clone)]
pub struct NapiSourceLocation {
    pub file: String,
    pub line: u32,
    pub column: u32,
}
