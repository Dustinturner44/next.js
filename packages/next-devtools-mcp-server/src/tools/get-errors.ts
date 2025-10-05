import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { makeDevtoolsRequest } from '../utils/api-client'

interface ErrorsResponse {
  errors: Record<string, ErrorState>
  hasErrors: boolean
  message?: string
  formatted?: string
}

interface ErrorState {
  errors: Array<{
    message: string
    stack?: string
  }>
  buildError?: {
    message: string
    stack?: string
  }
}

export function registerGetErrorsTool(server: McpServer) {
  server.registerTool(
    'get_errors',
    {
      description:
        'Get the current error state of the app when rendered in the browser, including any build or runtime errors with source-mapped stack traces',
      inputSchema: {
        baseUrl: z.string(),
      },
    },
    async (request) => {
      try {
        const { baseUrl } = request

        const response = await makeDevtoolsRequest<ErrorsResponse>(
          baseUrl,
          '/errors'
        )

        if (response.message) {
          return {
            content: [
              {
                type: 'text',
                text: response.message,
              },
            ],
          }
        }

        if (!response.hasErrors) {
          return {
            content: [
              {
                type: 'text',
                text:
                  response.message ||
                  'No errors detected in browser session(s).',
              },
            ],
          }
        }

        const output =
          response.formatted || formatErrorsResponse(response.errors)

        return {
          content: [
            {
              type: 'text',
              text: output,
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

function formatErrorsResponse(errors: Record<string, ErrorState>): string {
  const lines: string[] = []

  for (const [url, state] of Object.entries(errors)) {
    lines.push(`### Browser session: ${url}`)
    lines.push('')

    if (state.buildError) {
      lines.push('**Build Error:**')
      lines.push(state.buildError.message)
      if (state.buildError.stack) {
        lines.push('```')
        lines.push(state.buildError.stack)
        lines.push('```')
      }
      lines.push('')
    }

    if (state.errors.length > 0) {
      lines.push('**Runtime Errors:**')
      for (const error of state.errors) {
        lines.push(`- ${error.message}`)
        if (error.stack) {
          lines.push('```')
          lines.push(error.stack)
          lines.push('```')
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}
