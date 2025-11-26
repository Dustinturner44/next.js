/**
 * MCP tool for getting the module graph of a Turbopack entrypoint.
 *
 * This tool exposes the module dependency graph for a specific route including:
 * - All modules and their file paths
 * - Module sizes (individual and retained)
 * - Import/export relationships between modules
 * - Chunking information
 *
 * Based on the original implementation from PR #81770.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import type {
  Project,
  Entrypoints,
  ModuleGraphSnapshot,
  ModuleInfo,
} from '../../../build/swc/types'
import { mcpTelemetryTracker } from '../mcp-telemetry-tracker'
import z from 'next/dist/compiled/zod'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatModuleInfo(module: ModuleInfo, index: number): string {
  const lines = [
    `[${index}] ${module.path}`,
    `    Size: ${formatBytes(module.size)} (retained: ${formatBytes(module.retainedSize)})`,
    `    Depth: ${module.depth}`,
  ]

  if (module.references.length > 0) {
    const refs = module.references
      .slice(0, 10)
      .map((ref) => `[${ref.index}] (${ref.chunkingType})`)
      .join(', ')
    const more =
      module.references.length > 10
        ? ` ... and ${module.references.length - 10} more`
        : ''
    lines.push(`    Imports: ${refs}${more}`)
  }

  if (module.incomingReferences.length > 0) {
    const refs = module.incomingReferences
      .slice(0, 10)
      .map((ref) => `[${ref.index}]`)
      .join(', ')
    const more =
      module.incomingReferences.length > 10
        ? ` ... and ${module.incomingReferences.length - 10} more`
        : ''
    lines.push(`    Imported by: ${refs}${more}`)
  }

  return lines.join('\n')
}

function formatModuleGraphSummary(graph: ModuleGraphSnapshot): string {
  const totalSize = graph.modules.reduce((acc, m) => acc + m.size, 0)
  const entryModules = graph.entries.map((i) => graph.modules[i])

  const lines = [
    `Module Graph Summary:`,
    `  Total modules: ${graph.modules.length}`,
    `  Total size: ${formatBytes(totalSize)}`,
    `  Entry points: ${graph.entries.length}`,
    '',
    'Entry modules:',
    ...entryModules.map(
      (m, i) => `  [${graph.entries[i]}] ${m.path} (${formatBytes(m.size)})`
    ),
  ]

  return lines.join('\n')
}

const PAGE_SIZE = 50

export function registerGetModuleGraphTool(
  server: McpServer,
  getTurbopackProject: () => Project | undefined,
  getCurrentEntrypoints: () => Entrypoints | undefined
) {
  server.registerTool(
    'get_module_graph',
    {
      description:
        'Get the module dependency graph for a specific route. Returns all modules, their sizes, and import relationships. Only available when running with Turbopack.',
      inputSchema: {
        route: z
          .string()
          .describe(
            'The route to get the module graph for (e.g., "/dashboard/page", "/api/hello"). Use get_turbopack_entrypoints to see available routes.'
          ),
        page: z
          .number()
          .optional()
          .describe(
            'Modules are paginated when there are more than 50. The first page is number 0.'
          ),
      },
    },
    async (request) => {
      // Track telemetry
      mcpTelemetryTracker.recordToolCall('mcp/get_module_graph')

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

        const route = request.route

        // Find the route in app or page entrypoints
        let endpoint = null
        let routeType = ''

        // Check App Router routes
        const appRoute = entrypoints.app.get(route)
        if (appRoute) {
          routeType = appRoute.type
          if (appRoute.type === 'app-page') {
            // Use rscEndpoint for App Router pages (server components)
            endpoint = appRoute.rscEndpoint
          } else if (appRoute.type === 'app-route') {
            endpoint = appRoute.endpoint
          }
        }

        // Check Pages Router routes
        if (!endpoint) {
          const pageRoute = entrypoints.page.get(route)
          if (pageRoute) {
            routeType = pageRoute.type
            if (pageRoute.type === 'page') {
              endpoint = pageRoute.htmlEndpoint
            } else if (pageRoute.type === 'page-api') {
              endpoint = pageRoute.endpoint
            }
          }
        }

        if (!endpoint) {
          // List available routes for the user
          const availableRoutes = [
            ...Array.from(entrypoints.app.keys()),
            ...Array.from(entrypoints.page.keys()),
          ]
            .slice(0, 20)
            .join(', ')

          return {
            content: [
              {
                type: 'text',
                text: `Route "${route}" not found. Available routes include: ${availableRoutes}${
                  entrypoints.app.size + entrypoints.page.size > 20
                    ? '... (use get_turbopack_entrypoints for full list)'
                    : ''
                }`,
              },
            ],
          }
        }

        // Check if getModuleGraph is available
        if (typeof endpoint.getModuleGraph !== 'function') {
          return {
            content: [
              {
                type: 'text',
                text: 'Module graph API is not available. This feature requires a newer version of Turbopack.',
              },
            ],
          }
        }

        // Get the module graph
        const result = await endpoint.getModuleGraph()
        const graph = result as ModuleGraphSnapshot

        if (!graph || !graph.modules) {
          return {
            content: [
              {
                type: 'text',
                text: `No module graph available for route "${route}". The route may not have been compiled yet.`,
              },
            ],
          }
        }

        const content: Array<{ type: 'text'; text: string }> = []

        // Add summary
        content.push({
          type: 'text',
          text: `Module graph for "${route}" (${routeType}):\n\n${formatModuleGraphSummary(graph)}`,
        })

        // Paginate modules
        const page = request.page ?? 0
        const startIndex = page * PAGE_SIZE
        const endIndex = Math.min(startIndex + PAGE_SIZE, graph.modules.length)
        const currentPageModules = graph.modules.slice(startIndex, endIndex)

        if (currentPageModules.length > 0) {
          content.push({
            type: 'text',
            text: `\nModules (${startIndex + 1}-${endIndex} of ${graph.modules.length}):`,
          })

          for (let i = 0; i < currentPageModules.length; i++) {
            content.push({
              type: 'text',
              text: formatModuleInfo(currentPageModules[i], startIndex + i),
            })
          }
        }

        if (endIndex < graph.modules.length) {
          content.push({
            type: 'text',
            text: `\nNote: There are more modules available. Use the \`page\` parameter to query the next page (page=${page + 1}).`,
          })
        }

        return { content }
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
