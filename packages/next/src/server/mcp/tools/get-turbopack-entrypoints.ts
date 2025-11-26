/**
 * MCP tool for getting Turbopack entrypoints.
 *
 * This tool exposes all entrypoints from a running Turbopack project including:
 * - App Router pages and routes
 * - Pages Router pages and API routes
 * - Middleware
 * - Instrumentation
 *
 * Based on the original implementation from PR #81770.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import type {
  Project,
  Entrypoints,
  PageRoute,
  AppRoute,
} from '../../../build/swc/types'
import { mcpTelemetryTracker } from '../mcp-telemetry-tracker'

function pageRouteToTitle(route: PageRoute): string {
  switch (route.type) {
    case 'page':
      return 'A page using Pages Router.'
    case 'page-api':
      return 'An API route using Pages Router.'
    default:
      return 'Unknown page route type'
  }
}

function appRouteToTitle(route: AppRoute): string {
  switch (route.type) {
    case 'app-page':
      return 'A page using App Router.'
    case 'app-route':
      return 'A route handler using App Router.'
    default:
      return 'Unknown app route type'
  }
}

export function registerGetTurbopackEntrypointsTool(
  server: McpServer,
  getTurbopackProject: () => Project | undefined,
  getCurrentEntrypoints: () => Entrypoints | undefined
) {
  server.registerTool(
    'get_turbopack_entrypoints',
    {
      description:
        'Get all Turbopack entrypoints including pages, routes, middleware, and instrumentation. Only available when running with Turbopack.',
      inputSchema: {},
    },
    async () => {
      // Track telemetry
      mcpTelemetryTracker.recordToolCall('mcp/get_turbopack_entrypoints')

      try {
        const turbopackProject = getTurbopackProject()
        if (!turbopackProject) {
          return {
            content: [
              {
                type: 'text',
                text: 'Turbopack is not available. This tool only works when running with Turbopack (next dev --turbopack).',
              },
            ],
          }
        }

        const entrypoints = getCurrentEntrypoints()
        if (!entrypoints) {
          return {
            content: [
              {
                type: 'text',
                text: 'Entrypoints are not yet available. The dev server may still be starting up.',
              },
            ],
          }
        }

        const list: string[] = []

        // App Router entrypoints
        for (const [key, route] of entrypoints.app.entries()) {
          list.push(`\`${key}\` (${appRouteToTitle(route)})`)
        }

        // Pages Router entrypoints
        for (const [key, route] of entrypoints.page.entries()) {
          list.push(`\`${key}\` (${pageRouteToTitle(route)})`)
        }

        // Global entrypoints
        if (entrypoints.global.middleware) {
          list.push(
            `Middleware${entrypoints.global.middleware.isProxy ? ' (proxy)' : ''}`
          )
        }

        if (entrypoints.global.instrumentation) {
          list.push('Instrumentation')
        }

        if (entrypoints.global.app) {
          list.push('Custom App (_app)')
        }

        if (entrypoints.global.document) {
          list.push('Custom Document (_document)')
        }

        if (entrypoints.global.error) {
          list.push('Custom Error (_error)')
        }

        return {
          content: [
            {
              type: 'text',
              text: `These are the entrypoints of the application:

${list.map((e) => `- ${e}`).join('\n')}`,
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
