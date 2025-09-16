import type { IncomingMessage, ServerResponse } from 'http'
import type { NextConfig } from '../config-shared'
import type webpack from 'webpack'
import type { Project } from '../../build/swc/types'
import { createMcpServer } from '../mcp/mcp-server'
import { parseBody } from '../api-utils/node/parse-body'
import { getOriginalStackFrames as getOriginalStackFramesWebpack } from './middleware-webpack'
import { getOriginalStackFrames as getOriginalStackFramesTurbopack } from './middleware-turbopack'
import type {
  OriginalStackFramesRequest,
  OriginalStackFramesResponse,
} from '../../next-devtools/server/shared'
import { RESTART_EXIT_CODE } from '../lib/utils'
import { invalidatePersistentCache } from '../../build/webpack/cache-invalidation'

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

// Global storage for error data
interface ErrorsData {
  buildError: string | null
  runtimeErrors: Array<{
    id: string
    type: 'build' | 'runtime' | 'console' | 'recoverable'
    timestamp: string
    error: {
      name: string
      message: string
      stack?: string
      environmentName?: string
    }
    frames?: Array<{
      file: string | null
      methodName: string
      arguments: string[]
      line1: number | null
      column1: number | null
    }>
    codeFrame?: string
    hydrationWarning?: string | null
    notes?: string | null
    reactOutputComponentDiff?: string | null
  }>
  totalErrorCount: number
  isErrorOverlayOpen: boolean
  lastUpdated: string
}

let storedErrorsData: ErrorsData | null = null

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

// Export function to get stored errors data
export function getStoredErrorsData(): ErrorsData | null {
  return storedErrorsData
}

type StackFrameResolver = (
  request: OriginalStackFramesRequest
) => Promise<OriginalStackFramesResponse>

type RestartHandler = (options: {
  cleanCache?: boolean
}) => Promise<{ success: boolean; message: string }>

export function createWebpackStackFrameResolver(
  clientStats: () => webpack.Stats | null,
  serverStats: () => webpack.Stats | null,
  edgeServerStats: () => webpack.Stats | null,
  rootDirectory: string
): StackFrameResolver {
  return async (request: OriginalStackFramesRequest) => {
    return getOriginalStackFramesWebpack({
      ...request,
      clientStats,
      serverStats,
      edgeServerStats,
      rootDirectory,
    })
  }
}

export function createWebpackRestartHandler(
  webpackCacheDirectories: Set<string>
): RestartHandler {
  return async ({ cleanCache = false }) => {
    if (cleanCache && webpackCacheDirectories) {
      await Promise.all(
        Array.from(webpackCacheDirectories).map(invalidatePersistentCache)
      )
    }

    // Schedule restart - same as restart-dev-server-middleware.ts
    setTimeout(() => {
      process.exit(RESTART_EXIT_CODE)
    }, 0)

    return {
      success: true,
      message: cleanCache
        ? 'Restarting server and clearing webpack cache...'
        : 'Restarting server...',
    }
  }
}

export function createTurbopackStackFrameResolver(
  project: Project,
  projectPath: string
): StackFrameResolver {
  return async (request: OriginalStackFramesRequest) => {
    return getOriginalStackFramesTurbopack({
      ...request,
      project,
      projectPath,
    })
  }
}

export function createTurbopackRestartHandler(
  project: Project
): RestartHandler {
  return async ({ cleanCache = false }) => {
    if (cleanCache && project) {
      await project.invalidatePersistentCache()
    }

    // Schedule restart - same as restart-dev-server-middleware.ts
    setTimeout(() => {
      process.exit(RESTART_EXIT_CODE)
    }, 0)

    return {
      success: true,
      message: cleanCache
        ? 'Restarting server and clearing turbopack cache...'
        : 'Restarting server...',
    }
  }
}

export function getMcpMiddleware(
  config: NextConfig,
  port?: number,
  dir?: string,
  stackFrameResolver?: StackFrameResolver,
  restartHandler?: RestartHandler
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

    // Handle error data storage endpoint
    if (url.pathname === '/_next/mcp/error-data') {
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

          const errorsData: ErrorsData = JSON.parse(body)
          storedErrorsData = errorsData

          console.log('[MCP] Error data stored:', {
            buildError: !!errorsData.buildError,
            runtimeErrorCount: errorsData.runtimeErrors.length,
            totalErrorCount: errorsData.totalErrorCount,
            lastUpdated: errorsData.lastUpdated,
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({ success: true, message: 'Error data stored' })
          )
          return
        } catch (error) {
          console.error('[MCP] Error storing error data:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: false,
              error: 'Failed to store error data',
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
    const server = createMcpServer(
      config,
      storedClientData,
      dir,
      stackFrameResolver,
      storedErrorsData,
      restartHandler
    )
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
