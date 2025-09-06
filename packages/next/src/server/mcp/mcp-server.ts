import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NextConfig } from '../config-shared'

export function createMcpServer(_config?: NextConfig): McpServer {
  const server = new McpServer({
    name: 'Next.js MCP Server',
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
        console.log('[MCP] get_next_version tool called - MCP is working! 🎉')
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

  return server
}
