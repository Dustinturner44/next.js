import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { makeDevtoolsRequest } from '../utils/api-client'

interface LogsResponse {
  logFilePath?: string
  error?: string
}

export function registerGetLogsTool(server: McpServer) {
  server.registerTool(
    'get_logs',
    {
      description:
        'Get the path to the Next.js development log file. Returns the file path so the agent can read the logs directly.',
      inputSchema: {
        baseUrl: z.string(),
      },
    },
    async (request) => {
      try {
        const { baseUrl } = request

        const response = await makeDevtoolsRequest<LogsResponse>(
          baseUrl,
          '/logs'
        )

        if (response.error) {
          return {
            content: [
              {
                type: 'text',
                text: response.error,
              },
            ],
          }
        }

        if (!response.logFilePath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Log file path not available.',
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Next.js log file path: ${response.logFilePath}`,
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
}
