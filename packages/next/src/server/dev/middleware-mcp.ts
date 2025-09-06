import type { IncomingMessage, ServerResponse } from 'http'
import type { NextConfig } from '../config-shared'
import { createMcpServer } from '../mcp/mcp-server'
import { parseBody } from '../api-utils/node/parse-body'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export function getMcpMiddleware(config: NextConfig, port?: number) {
  const serverPort = port || 3000
  const mcpUrl = `http://localhost:${serverPort}/_next/mcp`

  console.log(`[MCP] MCP server available at: ${mcpUrl}`)
  console.log('[MCP] Add to your claude_desktop_config.json:')
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          nextjs: {
            command: 'npx next@canary',
            args: ['mcp', '--port', String(serverPort)],
          },
        },
      },
      null,
      2
    )
  )

  return async function (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const url = new URL(`http://localhost${req.url}`)

    if (!url.pathname.startsWith('/_next/mcp')) {
      return next()
    }

    // Helper to send MCP error responses
    function sendMcpError(message: string, code = -32603) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code, message },
          id: null,
        })
      )
    }

    // Create MCP server and transport
    const server = createMcpServer(config)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    try {
      // Handle cleanup on connection close
      res.on('close', () => {
        transport.close()
        server.close()
      })

      // Connect server to transport
      await server.connect(transport)

      // Parse request body and handle MCP request
      const parsedBody = await parseBody(req, 1024 * 1024) // 1MB limit
      await transport.handleRequest(req, res, parsedBody)
    } catch (error) {
      console.error('[MCP] Error handling MCP request:', error)
      if (!res.headersSent) {
        sendMcpError('Internal server error')
      }
    }
  }
}
