# Next.js Devtools MCP Server

A standalone Model Context Protocol (MCP) server for Next.js development tools. This server provides AI agents with access to Next.js development server information through a standardized interface.

## Architecture

This package is designed to be decoupled from Next.js itself, allowing it to connect to any Next.js dev server running with `experimental.devtoolsApi: true`.

### How it works

1. Next.js dev server exposes devtools APIs at `/_next/devtools-api/*` when `experimental.devtoolsApi: true` is set
2. This MCP server acts as a bridge, consuming those APIs and exposing MCP tools
3. AI agents call `set_port` to configure which Next.js dev server to connect to
4. The MCP server then makes HTTP requests to the Next.js devtools API endpoints

## Available Tools

The MCP server exposes several tools for inspecting and interacting with a running Next.js development server:

- **Connection management** - Configure which dev server to connect to
- **Project information** - Get project metadata and configuration
- **Error inspection** - Access build and runtime errors with stack traces
- **Page metadata** - View information about currently open pages and routes
- **Development logs** - Get the path to the Next.js development log file
- **Server actions** - Inspect server action definitions and locations

For detailed tool schemas and parameters, refer to the MCP server's tool definitions or your MCP client's tool documentation.

## Usage

### MCP Client Configuration

Add to your MCP client configuration (e.g., `.mcp.json`):

```json
{
  "mcpServers": {
    "nextjs-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp-server@latest"]
    }
  }
}
```

### Next.js Configuration

Enable devtools APIs in your `next.config.js`:

```javascript
module.exports = {
  experimental: {
    devtoolsApi: true
  }
}
```

### Workflow

1. Start your Next.js dev server with `devtoolsApi` enabled
2. Configure the MCP server to connect to your dev server's port
3. AI agents can now access devtools information through MCP tools

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev
```

## Implementation Details

The server maintains a single port configuration that can be updated via `set_port`. All subsequent tool calls use this configured port to make HTTP requests to the Next.js devtools API.

This design allows AI agents to dynamically bind to different Next.js dev servers during their workflow without requiring a restart of the MCP server or client.

The devtools API is a general-purpose HTTP API that can be consumed by any tool, not just MCP servers.
