import type { IncomingMessage, ServerResponse } from 'http'
import type { NextConfig } from '../config-shared'
import { createMcpServer } from '../mcp/mcp-server'
import { parseBody } from '../api-utils/node/parse-body'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

// Global storage for client data (simple in-memory storage)
interface ClientData {
  userAgent: string
  viewport: {
    width: number
    height: number
  }
  url: string
  timestamp: string
  segmentTrie: SerializableSegmentTrieNode
  performance: {
    navigationStart: number
    loadEventEnd: number
    domContentLoadedEventEnd: number
  }
  location: {
    pathname: string
    search: string
    hash: string
    origin: string
  }
}

let storedClientData: ClientData | null = null

// Serializable segment trie node structure
interface SerializableSegmentTrieNode {
  value?: {
    type: string
    pagePath: string
    boundaryType: string | null
  }
  children: {
    [key: string]: SerializableSegmentTrieNode | undefined
  }
}

// Export function to get stored client data
export function getStoredClientData(): ClientData | null {
  return storedClientData
}

export function getMcpMiddleware(
  config: NextConfig,
  port?: number,
  dir?: string
) {
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

    // Handle client data storage endpoint
    if (url.pathname === '/_next/mcp/client-data') {
      if (req.method === 'POST') {
        try {
          const body = await new Promise<string>((resolve, reject) => {
            let data = ''
            req.on('data', (chunk) => {
              data += chunk
            })
            req.on('end', () => resolve(data))
            req.on('error', reject)
          })

          const clientData: ClientData = JSON.parse(body)
          storedClientData = clientData

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({ success: true, message: 'Client data stored' })
          )
          return
        } catch (error) {
          console.error('[MCP] Error storing client data:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: false,
              error: 'Failed to store client data',
            })
          )
          return
        }
      } else {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
        return
      }
    }

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
    const server = createMcpServer(config, storedClientData, dir)
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
      if (!res.headersSent) {
        sendMcpError('Internal server error')
      }
    }
  }
}
