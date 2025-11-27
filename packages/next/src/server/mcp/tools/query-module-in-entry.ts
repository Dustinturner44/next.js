/**
 * MCP tool for querying if a module exists in a specific entry.
 *
 * This tool checks whether a given module (package name or file path) is included
 * in an entry's bundle across different layers (server, client, etc.).
 *
 * Example inputs and expected outputs:
 *
 * 1. Package name query:
 *    Input: module="react", entry="/client/page"
 *    Output: Finds all modules containing "node_modules/react" in their path
 *
 * 2. File path query:
 *    Input: module="app/client/page.tsx", entry="/client/page"
 *    Output: Finds the page component module in both server (RSC) and client (HTML) layers
 *
 * 3. Partial path query:
 *    Input: module="components/Button", entry="/dashboard"
 *    Output: Finds any module whose path contains "components/Button"
 *
 * 4. Server Action query (NOTE: Server Actions are compiled differently):
 *    Input: module="app/client/custom-action.ts", entry="/client/page"
 *    Output: NOT FOUND - Server Actions with 'use server' are compiled into virtual
 *            modules with paths like "app/client/data:abc123" (where abc123 is a hash).
 *            The original filename is NOT preserved in the module graph.
 *            To find server action references, search for "action-client-wrapper" or
 *            the virtual module pattern "data:" instead.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import type {
  Project,
  Entrypoints,
  Endpoint,
  ModuleGraphSnapshot,
  ModuleInfo,
} from '../../../build/swc/types'
import { mcpTelemetryTracker } from '../mcp-telemetry-tracker'
import z from 'next/dist/compiled/zod'

interface ModuleMatch {
  layer: string
  module: ModuleInfo
  index: number
}

interface LayerResult {
  layer: string
  endpoint: Endpoint
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function matchesQuery(module: ModuleInfo, query: string): boolean {
  const normalizedQuery = query.toLowerCase()
  const modulePath = module.path.toLowerCase()
  const moduleIdent = module.ident.toLowerCase()

  // Check if query matches the path or ident
  // For package names like "react", check if it's in node_modules/react
  if (modulePath.includes(`node_modules/${normalizedQuery}`)) {
    return true
  }

  // For scoped packages like "@tanstack/react-query"
  if (modulePath.includes(`node_modules/${normalizedQuery.replace('/', '/')}`)) {
    return true
  }

  // For relative file paths, check if the path ends with or contains the query
  if (modulePath.includes(normalizedQuery)) {
    return true
  }

  // Check ident as well
  if (moduleIdent.includes(normalizedQuery)) {
    return true
  }

  return false
}

function formatMatchResult(match: ModuleMatch, showIdent = false): string {
  const lines = [
    `  [${match.index}] ${match.module.path}`,
    `      Size: ${formatBytes(match.module.size)} (retained: ${formatBytes(match.module.retainedSize)})`,
    `      Depth: ${match.module.depth}`,
  ]

  // Show ident if it differs from path (useful for debugging virtual modules)
  if (showIdent && match.module.ident !== match.module.path) {
    lines.push(`      Ident: ${match.module.ident}`)
  }

  if (match.module.incomingReferences.length > 0) {
    const importedBy = match.module.incomingReferences
      .slice(0, 5)
      .map((ref) => `[${ref.index}]`)
      .join(', ')
    const more =
      match.module.incomingReferences.length > 5
        ? ` ... and ${match.module.incomingReferences.length - 5} more`
        : ''
    lines.push(`      Imported by: ${importedBy}${more}`)
  }

  return lines.join('\n')
}

export function registerQueryModuleInEntryTool(
  server: McpServer,
  getTurbopackProject: () => Project | undefined,
  getCurrentEntrypoints: () => Entrypoints | undefined
) {
  server.registerTool(
    'query_module_in_entry',
    {
      description:
        'Query if a module (package name or file path) exists in a specific entry. Returns all occurrences across different layers (server, client, etc.). Only available when running with Turbopack.',
      inputSchema: {
        module: z
          .string()
          .describe(
            'The module to query. Can be a package name (e.g., "react", "lodash", "@tanstack/react-query") or a relative file path (e.g., "components/Button", "utils/helper.ts").'
          ),
        entry: z
          .string()
          .describe(
            'The entry to query (e.g., "/dashboard", "/api/hello"). Use get_turbopack_entrypoints to see available entries.'
          ),
      },
    },
    async (request) => {
      // Track telemetry
      mcpTelemetryTracker.recordToolCall('mcp/query_module_in_entry')

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

        const moduleQuery = request.module
        const entry = request.entry

        // Collect all endpoints for this entry with their layer names
        const layers: LayerResult[] = []
        let entryType = ''

        // Check App Router entries
        const appRoute = entrypoints.app.get(entry)
        if (appRoute) {
          entryType = appRoute.type
          if (appRoute.type === 'app-page') {
            layers.push({ layer: 'server (RSC)', endpoint: appRoute.rscEndpoint })
            layers.push({ layer: 'client (HTML)', endpoint: appRoute.htmlEndpoint })
          } else if (appRoute.type === 'app-route') {
            layers.push({ layer: 'server', endpoint: appRoute.endpoint })
          }
        }

        // Check Pages Router entries
        if (layers.length === 0) {
          const pageRoute = entrypoints.page.get(entry)
          if (pageRoute) {
            entryType = pageRoute.type
            if (pageRoute.type === 'page') {
              layers.push({ layer: 'server (HTML)', endpoint: pageRoute.htmlEndpoint })
              layers.push({ layer: 'client (Data)', endpoint: pageRoute.dataEndpoint })
            } else if (pageRoute.type === 'page-api') {
              layers.push({ layer: 'server', endpoint: pageRoute.endpoint })
            }
          }
        }

        if (layers.length === 0) {
          // List available entries for the user
          const availableEntries = [
            ...Array.from(entrypoints.app.keys()),
            ...Array.from(entrypoints.page.keys()),
          ]
            .slice(0, 20)
            .join(', ')

          return {
            content: [
              {
                type: 'text',
                text: `Entry "${entry}" not found. Available entries include: ${availableEntries}${
                  entrypoints.app.size + entrypoints.page.size > 20
                    ? '... (use get_turbopack_entrypoints for full list)'
                    : ''
                }`,
              },
            ],
          }
        }

        // Search for the module in each layer
        const results: Map<string, ModuleMatch[]> = new Map()
        const unavailableLayers: string[] = []

        for (const { layer, endpoint } of layers) {
          // Check if getModuleGraph is available
          if (typeof endpoint.getModuleGraph !== 'function') {
            unavailableLayers.push(layer)
            continue
          }

          try {
            const graphResult = await endpoint.getModuleGraph()
            const graph = graphResult as ModuleGraphSnapshot

            if (!graph || !graph.modules) {
              continue
            }

            const matches: ModuleMatch[] = []
            for (let i = 0; i < graph.modules.length; i++) {
              const module = graph.modules[i]
              if (matchesQuery(module, moduleQuery)) {
                matches.push({ layer, module, index: i })
              }
            }

            if (matches.length > 0) {
              results.set(layer, matches)
            }
          } catch (error) {
            // If getting module graph fails, note it but continue
            unavailableLayers.push(layer)
          }
        }

        // Format output
        const content: Array<{ type: 'text'; text: string }> = []

        content.push({
          type: 'text',
          text: `Querying "${moduleQuery}" in entry "${entry}" (${entryType}):`,
        })

        if (results.size === 0 && unavailableLayers.length === layers.length) {
          content.push({
            type: 'text',
            text: '\nModule graph API is not available. This feature requires a newer version of Turbopack.',
          })
          return { content }
        }

        if (results.size === 0) {
          // Check if query might be a server action file - look for data: virtual modules
          // in the same directory that could be compiled server actions
          const queryDir = moduleQuery
            .replace(/\\/g, '/')
            .split('/')
            .slice(0, -1)
            .join('/')
          const serverActionMatches: ModuleMatch[] = []

          // Re-scan for potential server action virtual modules
          for (const { layer, endpoint } of layers) {
            if (typeof endpoint.getModuleGraph !== 'function') continue
            try {
              const graphResult = await endpoint.getModuleGraph()
              const graph = graphResult as ModuleGraphSnapshot
              if (!graph || !graph.modules) continue

              for (let i = 0; i < graph.modules.length; i++) {
                const module = graph.modules[i]
                // Check for data: virtual modules in a matching directory
                if (
                  module.path.includes('data:') &&
                  queryDir &&
                  module.path.toLowerCase().includes(queryDir.toLowerCase())
                ) {
                  // Avoid duplicates
                  if (
                    !serverActionMatches.some(
                      (m) => m.module.path === module.path && m.layer === layer
                    )
                  ) {
                    serverActionMatches.push({ layer, module, index: i })
                  }
                }
              }
            } catch {
              // Ignore errors
            }
          }

          if (serverActionMatches.length > 0) {
            content.push({
              type: 'text',
              text: `\nModule "${moduleQuery}" was NOT found directly, but found potential Server Action reference(s):`,
            })
            content.push({
              type: 'text',
              text: `\nNote: Files with 'use server' are compiled into virtual modules with "data:" paths.`,
            })
            content.push({
              type: 'text',
              text: `The original filename is not preserved in the module graph.\n`,
            })

            for (const match of serverActionMatches.slice(0, 5)) {
              content.push({
                type: 'text',
                text: formatMatchResult(match, true),
              })
            }

            if (serverActionMatches.length > 5) {
              content.push({
                type: 'text',
                text: `  ... and ${serverActionMatches.length - 5} more potential matches`,
              })
            }
          } else {
            content.push({
              type: 'text',
              text: `\nModule "${moduleQuery}" was NOT found in any layer of this entry.`,
            })
          }

          if (unavailableLayers.length > 0) {
            content.push({
              type: 'text',
              text: `\nNote: Could not check layers: ${unavailableLayers.join(', ')} (module graph not available)`,
            })
          }

          return { content }
        }

        // Show results grouped by layer
        let totalMatches = 0
        for (const [layer, matches] of results) {
          totalMatches += matches.length
          content.push({
            type: 'text',
            text: `\n[${layer}] - ${matches.length} match${matches.length > 1 ? 'es' : ''}:`,
          })

          // Show up to 10 matches per layer
          const displayMatches = matches.slice(0, 10)
          for (const match of displayMatches) {
            content.push({
              type: 'text',
              text: formatMatchResult(match),
            })
          }

          if (matches.length > 10) {
            content.push({
              type: 'text',
              text: `  ... and ${matches.length - 10} more matches in this layer`,
            })
          }
        }

        // Summary
        const foundInLayers = Array.from(results.keys())
        const notFoundInLayers = layers
          .map((l) => l.layer)
          .filter((l) => !results.has(l) && !unavailableLayers.includes(l))

        content.push({
          type: 'text',
          text: `\nSummary: Found ${totalMatches} total match${totalMatches > 1 ? 'es' : ''} in ${foundInLayers.length} layer${foundInLayers.length > 1 ? 's' : ''}: ${foundInLayers.join(', ')}`,
        })

        if (notFoundInLayers.length > 0) {
          content.push({
            type: 'text',
            text: `Not found in: ${notFoundInLayers.join(', ')}`,
          })
        }

        if (unavailableLayers.length > 0) {
          content.push({
            type: 'text',
            text: `Could not check: ${unavailableLayers.join(', ')} (module graph not available)`,
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
