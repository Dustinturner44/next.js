import type { IncomingMessage, ServerResponse } from 'http'

import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { parseBody } from '../api-utils/node/parse-body'

function createMcpServer() {
  const server = new McpServer({
    name: 'Next.js MCP Server',
    // TODO: Next.js version decoupled from Next.js MCP Server version?
    version: '0.0.1',
  })

  // TODO: Add tools: https://modelcontextprotocol.io/docs/concepts/tools#implementing-tools

  return server
}

export function getMcpServerMiddleware() {
  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

  return async function nextMcpServerMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const { pathname } = new URL(`http://n${req.url}`)

    if (pathname === '/__nextjs_mcp') {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      let transport: StreamableHTTPServerTransport | null = null

      const body = await parseBody(req, '1mb')

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId]
      } else if (!sessionId && isInitializeRequest(body)) {
        // New initialization request
        const newTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            // Store the transport by session ID
            transports[newSessionId] = newTransport
          },
        })

        // Clean up transport when closed
        newTransport.onclose = () => {
          if (newTransport.sessionId) {
            delete transports[newTransport.sessionId]
          }
        }
        const server = createMcpServer()

        // Connect to the MCP server
        await server.connect(newTransport)
        transport = newTransport
      }

      if (transport !== null) {
        // Handle the request
        await transport.handleRequest(req, res, body)
        return
      }
    }
    next()
  }
}
