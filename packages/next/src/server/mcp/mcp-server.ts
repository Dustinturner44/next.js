import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NextConfig } from '../config-shared'

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

export function createMcpServer(
  _config?: NextConfig,
  clientData?: ClientData | null
): McpServer {
  const server = new McpServer({
    name: 'nextjs',
    version: '1.0.0-experimental',
    description: 'Next.js development server with MCP support',
  })

  // Register Next.js version tool directly with MCP SDK
  server.registerTool(
    'get_next_version',
    {
      description: 'Get the current Next.js version',
      inputSchema: {},
    },
    async (_request) => {
      try {
        return {
          content: [
            {
              type: 'text',
              text: `Next.js ${process.env.__NEXT_VERSION || 'unknown'}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )

  // Register client data tools
  server.registerTool(
    'get_client_info',
    {
      description:
        'Get current client information including user agent, viewport, URL, and segment trie data (when available).',
      inputSchema: {},
    },
    async (_request) => {
      try {
        if (!clientData) {
          return {
            content: [
              {
                type: 'text',
                text: 'No client data available. Make sure the client has sent data to the MCP server.',
              },
            ],
          }
        }

        const responseData = {
          userAgent: clientData.userAgent,
          viewport: clientData.viewport,
          url: clientData.url,
          timestamp: clientData.timestamp,
          location: clientData.location,
          performance: clientData.performance,
          ...(clientData.segmentTrie
            ? { segmentTrie: clientData.segmentTrie }
            : {}),
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(responseData, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'get_user_agent',
    {
      description: 'Get the current client user agent string',
      inputSchema: {},
    },
    async (_request) => {
      try {
        if (!clientData) {
          return {
            content: [
              {
                type: 'text',
                text: 'No client data available',
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: clientData.userAgent,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'get_segment_trie',
    {
      description:
        'Get the current client segment trie data showing app router structure',
      inputSchema: {},
    },
    async (_request) => {
      try {
        if (!clientData) {
          return {
            content: [
              {
                type: 'text',
                text: 'No client data available',
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(clientData.segmentTrie, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'get_client_performance',
    {
      description: 'Get client performance metrics including load times',
      inputSchema: {},
    },
    async (_request) => {
      try {
        if (!clientData) {
          return {
            content: [
              {
                type: 'text',
                text: 'No client data available',
              },
            ],
          }
        }

        const performance = clientData.performance
        const loadTime = performance.loadEventEnd - performance.navigationStart
        const domContentLoadedTime =
          performance.domContentLoadedEventEnd - performance.navigationStart

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  loadTime: `${loadTime}ms`,
                  domContentLoadedTime: `${domContentLoadedTime}ms`,
                  navigationStart: performance.navigationStart,
                  loadEventEnd: performance.loadEventEnd,
                  domContentLoadedEventEnd:
                    performance.domContentLoadedEventEnd,
                },
                null,
                2
              ),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )

  return server
}
