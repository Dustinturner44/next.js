import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { makeDevtoolsRequest } from '../utils/api-client'

interface ServerActionResponse {
  id: string
  name?: string
  file?: string
  line?: number
  column?: number
  source?: string
}

export function registerGetActionByIdTool(server: McpServer) {
  server.registerTool(
    'get_server_action_by_id',
    {
      description:
        'Get information about a server action by its ID, including source location',
      inputSchema: {
        baseUrl: z.string(),
        id: z.string(),
      },
    },
    async (request) => {
      try {
        const { baseUrl, id } = request

        const response = await makeDevtoolsRequest<ServerActionResponse>(
          baseUrl,
          `/server-action?id=${encodeURIComponent(id)}`
        )

        const lines: string[] = []

        lines.push(`**Server Action ID:** ${response.id}`)

        if (response.name) {
          lines.push(`**Name:** ${response.name}`)
        }

        if (response.file) {
          let location = response.file
          if (response.line !== undefined) {
            location += `:${response.line}`
            if (response.column !== undefined) {
              location += `:${response.column}`
            }
          }
          lines.push(`**Location:** ${location}`)
        }

        if (response.source) {
          lines.push('')
          lines.push('**Source:**')
          lines.push('```typescript')
          lines.push(response.source)
          lines.push('```')
        }

        return {
          content: [
            {
              type: 'text',
              text: lines.join('\n'),
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
