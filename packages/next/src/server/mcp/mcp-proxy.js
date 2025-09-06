#!/usr/bin/env node

/**
 * MCP Proxy for Next.js
 *
 * This proxy bridges between Claude Desktop's command-based MCP client
 * and Next.js's HTTP-based MCP server.
 */

const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js')
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js')

async function createProxy() {
  const server = new McpServer({
    name: 'Next.js MCP Proxy',
    version: '1.0.0',
    description: 'Proxy to Next.js HTTP MCP server',
  })

  // Forward all requests to Next.js HTTP MCP endpoint
  const NEXTJS_MCP_URL =
    process.env.NEXTJS_MCP_URL || 'http://localhost:3000/_next/mcp'

  // Forward all requests to Next.js MCP server
  async function forwardRequest(method, params) {
    try {
      const response = await fetch(NEXTJS_MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle SSE response
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const text = await response.text()
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6)
            if (jsonStr.trim()) {
              return JSON.parse(jsonStr)
            }
          }
        }
      } else {
        return await response.json()
      }
    } catch (error) {
      throw new Error(
        `Failed to connect to Next.js MCP server: ${error.message}`
      )
    }
  }

  // Override server methods to forward requests
  const originalConnect = server.connect.bind(server)
  server.connect = async (transport) => {
    // First get tools from the Next.js server
    try {
      const toolsResponse = await forwardRequest('tools/list', {})
      if (toolsResponse.result?.tools) {
        // Register each tool as a proxy
        for (const tool of toolsResponse.result.tools) {
          server.registerTool(tool.name, tool, async (params) => {
            const result = await forwardRequest('tools/call', {
              name: tool.name,
              arguments: params,
            })
            return result.result
          })
        }
      }
    } catch (error) {
      console.error(
        '[MCP Proxy] Failed to fetch tools from Next.js server:',
        error.message
      )
    }

    return originalConnect(transport)
  }

  // Create stdio transport for Claude Desktop
  const transport = new StdioServerTransport()

  console.error(`[MCP Proxy] Starting proxy to ${NEXTJS_MCP_URL}`)
  console.error('[MCP Proxy] Ready to handle requests from Claude Desktop')

  await server.connect(transport)
}

// Handle process cleanup
process.on('SIGINT', () => {
  console.error('[MCP Proxy] Received SIGINT, shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.error('[MCP Proxy] Received SIGTERM, shutting down...')
  process.exit(0)
})

// Start the proxy
createProxy().catch((error) => {
  console.error('[MCP Proxy] Failed to start:', error)
  process.exit(1)
})
