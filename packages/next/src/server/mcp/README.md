# Next.js MCP (Model Context Protocol) Integration

## Architecture Overview

Next.js provides an MCP server that allows AI assistants like Claude Code to introspect and interact with Next.js development servers.

### Components

1. **Session Manager** (`next-mcp-stdio.ts`)
   - Runs as a standalone process via `npx next@canary mcp`
   - Manages multiple Next.js dev servers across the machine
   - Uses stdio transport for communication with Claude Code
   - Routes MCP requests to the correct dev server

2. **Dev Server Registry** (`/tmp/next-dev-servers.json`)
   - Global registry of all running Next.js dev servers
   - Updated via heartbeat every 30 seconds
   - Auto-cleaned of stale/dead servers

3. **Dev Server Integration** (`standalone-mcp-server.ts`)
   - Each `next dev` registers itself in the global registry
   - Implements MCP tools via `/_next/mcp` endpoint
   - Provides access to errors, logs, metadata, etc.

## Data Flow

```
┌──────────────────┐
│   Claude Code    │
└────────┬─────────┘
         │ stdio (JSON-RPC)
         ↓
┌────────────────────────────────┐
│  Session Manager               │
│  (npx next@canary mcp)         │
│  • Watches registry            │
│  • Routes requests             │
└─────┬────────────┬────────────┘
      │ HTTP       │ HTTP
      ↓            ↓
┌──────────┐  ┌──────────┐
│ next@14  │  │ next@15  │
│ :3000    │  │ :3001    │
└──────────┘  └──────────┘
```

## Configuration

### Claude Code Setup

Add to Claude Code's MCP configuration:

```json
{
  "mcpServers": {
    "nextjs": {
      "command": "npx",
      "args": ["-y", "next@canary", "mcp"]
    }
  }
}
```

### Usage

```bash
# Start dev server - it auto-registers
cd ~/my-next-app
next dev

# Claude Code can now access MCP tools
```

## Available MCP Tools

### `list_dev_servers()`

Lists all running Next.js dev servers.

**Returns:**
```json
{
  "servers": [
    {
      "projectPath": "/Users/alice/app-a",
      "port": 3000,
      "hostname": "localhost",
      "pid": 12345
    }
  ]
}
```

### `get_project_path({ projectPath?: string })`

Get the absolute path to a Next.js project.

**Parameters:**
- `projectPath` (optional): Path hint for multi-project scenarios

**Returns:** Absolute project path

### `get_errors({ projectPath?: string })`

Get current browser error state including build and runtime errors.

**Parameters:**
- `projectPath` (optional): Path hint for multi-project scenarios

**Returns:** Formatted error messages with source-mapped stack traces

### `get_page_metadata({ projectPath?: string })`

Get metadata about the currently loaded page in the browser.

**Parameters:**
- `projectPath` (optional): Path hint for multi-project scenarios

**Returns:** Page metadata (route, params, searchParams, etc.)

### `get_logs({ projectPath?: string })`

Get recent build and runtime logs from the dev server.

**Parameters:**
- `projectPath` (optional): Path hint for multi-project scenarios

**Returns:** Recent log entries

### `get_server_action_by_id({ actionId: string, projectPath?: string })`

Get information about a specific server action.

**Parameters:**
- `actionId` (required): The server action ID
- `projectPath` (optional): Path hint for multi-project scenarios

**Returns:** Server action details

## Multi-Project Support

### Single Project (Auto-routing)

```javascript
// No projectPath needed - routes to only dev server
get_errors()
```

### Multiple Projects (Requires Context)

```javascript
// List all dev servers
list_dev_servers()

// Specify project explicitly
get_errors({ projectPath: "/Users/alice/app-a" })
get_errors({ projectPath: "app-a" }) // Partial match OK
```

## Version Compatibility

The session manager advertises all tools from the version you run (`next@canary`), but each dev server implements only the tools it supports.

**Example:**

```javascript
// Session manager from next@canary has get_ai_hints
// Dev server running next@14 doesn't have it

get_ai_hints({ projectPath: "/old-project" })
// Error: Tool 'get_ai_hints' is not supported in this project.
//        This tool may require a newer version of Next.js.
//        Try upgrading: npm install next@latest
```

This allows gradual upgrades and testing of new features.

## Registry Format

**Location:** `/tmp/next-dev-servers.json` (macOS/Linux) or `%TEMP%\next-dev-servers.json` (Windows)

**Schema:**
```typescript
{
  "/absolute/path/to/project": {
    "port": 3000,
    "hostname": "localhost",
    "pid": 12345,
    "projectPath": "/absolute/path/to/project",
    "lastSeen": 1704067200000  // Unix timestamp
  }
}
```

## Cleanup & Lifecycle

### Automatic Cleanup

Servers are removed from registry when:
- Process exits normally (`process.on('exit')`)
- Process receives SIGINT/SIGTERM
- Heartbeat expires (>60 seconds without update)
- Process PID no longer exists

### Manual Cleanup

```bash
# Remove stale registry
rm /tmp/next-dev-servers.json
```

## Error Handling

### No Dev Servers Running

```
Error: No dev servers running. Please start a dev server with `next dev`
```

### Multiple Dev Servers (No Context)

```
Error: Multiple dev servers running (2). Please specify projectPath.
Available projects:
  - /Users/alice/app-a
  - /Users/alice/app-b

Example: get_errors({ projectPath: "/Users/alice/app-a" })
```

### Dev Server Not Found

```
Error: Could not find dev server for context "app-c".
Available projects:
  - /Users/alice/app-a
  - /Users/alice/app-b

Use get_project_path() with one of the paths above.
```

### Connection Timeout

```
Error: Request to dev server timed out (/Users/alice/app-a).
The dev server may be unresponsive.
```

### Tool Not Supported

```
Error: Tool 'get_ai_hints' is not supported in this project (/Users/alice/app-a).

This tool may require a newer version of Next.js.
Try upgrading: npm install next@latest
```

## Implementation Details

### Atomic File Writes

Registry updates use atomic writes to prevent corruption:

```typescript
// Write to temp file
fs.writeFileSync(`${registryPath}.${pid}.tmp`, data)
// Atomic rename
fs.renameSync(tempPath, registryPath)
```

### Heartbeat System

Each dev server updates `lastSeen` every 30 seconds. Session manager polls every 2 seconds to clean stale entries.

### Process Detection

Uses `process.kill(pid, 0)` to check if process is alive without sending a signal.

### Signal Handling

Proper exit codes:
- `SIGINT` → exit code 130
- `SIGTERM` → exit code 143

## Debugging

### Enable Session Manager Logs

```bash
# Run manually to see logs
npx next@canary mcp
```

**Output:**
```
[MCP] Session manager started
[MCP] Managing all Next.js dev servers on this machine
[MCP] Currently tracking 0 dev server(s)
[MCP] Waiting for dev servers to start...
[MCP] Run `next dev` in a Next.js project to register it
[MCP] Registry updated: 1 dev server(s) active
[MCP]   - /Users/alice/app-a on localhost:3000
```

### Check Registry

```bash
# macOS/Linux
cat /tmp/next-dev-servers.json | jq

# Windows
type %TEMP%\next-dev-servers.json
```

### Test MCP Tools

Use `fetch` to test tools directly:

```javascript
const response = await fetch('http://localhost:3000/_next/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { name: 'get_errors', arguments: {} },
    id: 1
  })
})
```

## Security Considerations

1. **Local-only**: Registry and MCP endpoints are only accessible on localhost
2. **No auth**: Assumes trusted local environment
3. **PID validation**: Prevents stale entries from zombie processes
4. **Path normalization**: Prevents path traversal attacks

## Performance

- **Registry size**: ~1KB per dev server
- **Heartbeat overhead**: ~1 file write per 30s per dev server
- **Tool call latency**: <100ms (HTTP proxy overhead)
- **Memory**: ~5MB for session manager

## Future Enhancements

1. **WebSocket transport**: If MCP adds WebSocket support
2. **Tool discovery**: Dynamic tool registration from dev servers
3. **Authentication**: Add token-based auth for registry access
4. **Remote dev servers**: Support cloud dev environments
5. **Performance metrics**: Track tool call latency and usage
