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

// Helper function to filter out non-rendered items from segment trie
function filterRenderedSegments(
  node: SerializableSegmentTrieNode
): SerializableSegmentTrieNode | null {
  // Filter out boundaries and built-in Next.js files
  const shouldExclude = (pagePath: string): boolean => {
    return (
      pagePath.endsWith('@boundary') || pagePath.includes('__next_builtin__')
    )
  }

  // If this node should be excluded, return null
  if (node.value && shouldExclude(node.value.pagePath)) {
    return null
  }

  // Recursively filter children
  const filteredChildren: { [key: string]: SerializableSegmentTrieNode } = {}
  let hasValidChildren = false

  for (const [key, child] of Object.entries(node.children)) {
    if (child) {
      const filteredChild = filterRenderedSegments(child)
      if (filteredChild) {
        filteredChildren[key] = filteredChild
        hasValidChildren = true
      }
    }
  }

  // If this node has no value and no valid children, exclude it
  if (!node.value && !hasValidChildren) {
    return null
  }

  return {
    ...(node.value && { value: node.value }),
    children: filteredChildren,
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

        // Filter out non-rendered segments (boundaries and built-ins)
        const filteredTrie = filterRenderedSegments(clientData.segmentTrie)

        return {
          content: [
            {
              type: 'text',
              text: filteredTrie
                ? JSON.stringify(filteredTrie, null, 2)
                : 'No rendered segments found',
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

  // Register tool to get only rendered files (filtered list)
  server.registerTool(
    'get_rendered_files',
    {
      description:
        'Get a list of only the actually rendered files (excludes boundaries and built-in Next.js files)',
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

        // Extract rendered file paths from filtered trie
        const extractRenderedFiles = (
          node: SerializableSegmentTrieNode | null
        ): string[] => {
          if (!node) return []

          const files: string[] = []

          if (node.value) {
            files.push(node.value.pagePath)
          }

          for (const child of Object.values(node.children)) {
            if (child) {
              files.push(...extractRenderedFiles(child))
            }
          }

          return files
        }

        const filteredTrie = filterRenderedSegments(clientData.segmentTrie)
        const renderedFiles = extractRenderedFiles(filteredTrie)

        return {
          content: [
            {
              type: 'text',
              text:
                renderedFiles.length > 0
                  ? `Rendered files:\n${renderedFiles.map((file) => `- ${file}`).join('\n')}`
                  : 'No rendered files found',
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
