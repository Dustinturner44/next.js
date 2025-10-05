import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { makeDevtoolsRequest } from '../utils/api-client'

interface ProjectPathResponse {
  projectPath: string
}

export function registerGetProjectPathTool(server: McpServer) {
  server.registerTool(
    'get_project_path',
    {
      description:
        'Returns the absolute path of the root directory for this Next.js project.',
      inputSchema: {
        baseUrl: z.string(),
      },
    },
    async (request) => {
      try {
        const { baseUrl } = request

        const response = await makeDevtoolsRequest<ProjectPathResponse>(
          baseUrl,
          '/project-path'
        )

        if (!response.projectPath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Unable to determine the absolute path of the Next.js project.',
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: response.projectPath,
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
