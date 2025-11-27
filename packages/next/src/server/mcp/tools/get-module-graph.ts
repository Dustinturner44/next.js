/**
 * MCP tool for getting the module graph of a Turbopack entrypoint.
 *
 * This tool exposes a refined module dependency graph for a specific route:
 * - Only userland modules (filters out Next.js internals)
 * - External dependencies consolidated by export path (lodash, lodash/map)
 * - Bundle layer information (server RSC, client HTML)
 *
 * Based on the original implementation from PR #81770.
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
import * as fs from 'fs'
import * as path from 'path'

/** Server Action entry from the manifest */
interface ServerActionEntry {
  exportedName: string
  filename: string
}

/** Structure of server-reference-manifest.json */
interface ServerReferenceManifest {
  node: Record<string, ServerActionEntry>
  edge: Record<string, ServerActionEntry>
}

/**
 * Load the server-reference-manifest.json and build a map from
 * directory paths to their Server Action source files.
 */
function loadServerActionMap(
  distDir: string,
  route: string
): Map<string, string[]> {
  const actionMap = new Map<string, string[]>()

  try {
    // The manifest is in .next/server/app/{route}/server-reference-manifest.json
    // But for dev it's in .next/dev/server/app/{route}/server-reference-manifest.json
    const possiblePaths = [
      path.join(distDir, 'server', 'app', route, 'server-reference-manifest.json'),
      path.join(distDir, 'dev', 'server', 'app', route, 'server-reference-manifest.json'),
    ]

    let manifestContent: string | undefined
    for (const manifestPath of possiblePaths) {
      if (fs.existsSync(manifestPath)) {
        manifestContent = fs.readFileSync(manifestPath, 'utf-8')
        break
      }
    }

    if (!manifestContent) return actionMap

    const manifest: ServerReferenceManifest = JSON.parse(manifestContent)

    // Process both node and edge actions
    for (const actions of [manifest.node, manifest.edge]) {
      if (!actions) continue
      for (const action of Object.values(actions)) {
        if (action.filename) {
          // Extract directory from filename
          const dir = path.dirname(action.filename)
          const existing = actionMap.get(dir) || []
          if (!existing.includes(action.filename)) {
            existing.push(action.filename)
          }
          actionMap.set(dir, existing)
        }
      }
    }
  } catch {
    // Ignore errors loading manifest
  }

  return actionMap
}

/** Module reference with layer info */
interface ModuleReference {
  /** Module path */
  path: string
  /** Layers where this reference exists */
  layers: string[]
}

/** Represents a refined module in the output */
interface RefinedModule {
  /** Source file path (original file for virtual modules, or display path) */
  source: string
  /** Virtual module identifier (e.g., data:xxx for Server Actions) */
  bundledAs?: string
  /** Module type: 'userland' | 'external' | 'virtual' */
  type: 'userland' | 'external' | 'virtual'
  /** Total size in bytes (aggregated for external packages) */
  size: number
  /** Retained size in bytes */
  retainedSize: number
  /** Minimum depth from entry */
  depth: number
  /** Layers this module appears in */
  layers: string[]
  /** Dependencies with layer info */
  imports: ModuleReference[]
  /** Dependents with layer info */
  importedBy: ModuleReference[]
}

/** Result of processing module graph */
interface RefinedModuleGraph {
  route: string
  routeType: string
  layers: string[]
  summary: {
    totalModules: number
    userlandModules: number
    externalPackages: number
    virtualModules: number
    totalSize: number
  }
  modules: RefinedModule[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Check if a module path is a Next.js internal module
 */
function isNextInternal(path: string): boolean {
  // Filter out Next.js internals
  const internalPatterns = [
    '/packages/next/',
    '/dist/compiled/',
    '/next/dist/',
    'next/dist/',
    '[turbopack]/',
    '[externals]/',
    'dist/esm/build/templates/',
    'dist/client/components/builtin/',
    'dist/server/route-modules/',
    'next-devtools/',
  ]
  const lowerPath = path.toLowerCase()
  return internalPatterns.some((pattern) => lowerPath.includes(pattern))
}

/**
 * Extract external package export path from a node_modules path
 * e.g., node_modules/lodash/map.js -> lodash/map
 * e.g., node_modules/@tanstack/react-query/dist/index.js -> @tanstack/react-query
 * e.g., node_modules/.pnpm/react@18.2.0/node_modules/react/index.js -> react
 */
function getExternalPackagePath(modulePath: string): string | null {
  // Handle pnpm's nested node_modules structure:
  // node_modules/.pnpm/pkg@version/node_modules/pkg/file.js
  const pnpmMatch = modulePath.match(
    /node_modules\/\.pnpm\/[^/]+\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/
  )
  if (pnpmMatch) {
    const packageName = pnpmMatch[1]
    const afterPackage = modulePath.split(pnpmMatch[0])[1]
    return extractSubpath(packageName, afterPackage)
  }

  // Standard node_modules structure
  const nodeModulesMatch = modulePath.match(
    /node_modules\/(@[^/]+\/[^/]+|[^/]+)/
  )
  if (!nodeModulesMatch) return null

  const packageName = nodeModulesMatch[1]
  // Skip .pnpm directory if standard match hit it
  if (packageName === '.pnpm') return null

  const afterPackage = modulePath.split(nodeModulesMatch[0])[1]
  return extractSubpath(packageName, afterPackage)
}

function extractSubpath(
  packageName: string,
  afterPackage: string | undefined
): string {
  if (!afterPackage || afterPackage === '/index.js' || afterPackage === '/') {
    return packageName
  }

  // Check if it's an internal file (dist/, lib/, src/, etc.)
  const internalDirs = ['/dist/', '/lib/', '/src/', '/build/', '/cjs/', '/esm/']
  if (internalDirs.some((dir) => afterPackage.includes(dir))) {
    return packageName
  }

  // Otherwise, include the subpath (e.g., lodash/map)
  const subpath = afterPackage
    .replace(/^\//, '')
    .replace(/\.(js|ts|mjs|cjs|jsx|tsx)$/, '')
    .replace(/\/index$/, '')

  return subpath ? `${packageName}/${subpath}` : packageName
}

/**
 * Determine module type from path
 */
function getModuleType(
  path: string
): 'userland' | 'external' | 'virtual' | 'internal' {
  if (isNextInternal(path)) return 'internal'
  if (path.includes('node_modules/')) return 'external'
  if (path.includes('data:') || path.includes('virtual:')) return 'virtual'
  return 'userland'
}

/**
 * Get a clean display path for userland modules
 */
function getUserlandPath(modulePath: string, projectPath: string): string {
  // Remove [project] prefix and project path
  let cleanPath = modulePath
    .replace(/^\[project\]\//, '')
    .replace(projectPath, '')
    .replace(/^\//, '')

  // Remove query strings and fragments
  cleanPath = cleanPath.split('?')[0].split('#')[0]

  return cleanPath
}

/**
 * Process a module graph from a single layer
 */
/** Internal module data with layer-aware references */
interface InternalModuleData {
  type: 'userland' | 'external' | 'virtual'
  size: number
  retainedSize: number
  depth: number
  layers: Set<string>
  /** Map of import path -> layers where the import exists */
  imports: Map<string, Set<string>>
  /** Map of importer path -> layers where the import exists */
  importedBy: Map<string, Set<string>>
  originalIndices: number[]
}

function processGraphLayer(
  graph: ModuleGraphSnapshot,
  layer: string,
  projectPath: string
): Map<string, InternalModuleData> {
  const moduleMap = new Map<string, InternalModuleData>()

  // First pass: create module entries
  const indexToPath = new Map<number, string>()

  for (let i = 0; i < graph.modules.length; i++) {
    const module = graph.modules[i]
    const moduleType = getModuleType(module.path)

    // Skip Next.js internals
    if (moduleType === 'internal') continue

    let displayPath: string
    if (moduleType === 'external') {
      displayPath = getExternalPackagePath(module.path) || module.path
    } else if (moduleType === 'userland') {
      displayPath = getUserlandPath(module.path, projectPath)
    } else {
      // virtual
      displayPath = module.path.replace(/^\[project\]\//, '')
    }

    indexToPath.set(i, displayPath)

    const existing = moduleMap.get(displayPath)
    if (existing) {
      // Aggregate sizes and update depth
      existing.size += module.size
      existing.retainedSize = Math.max(existing.retainedSize, module.retainedSize)
      existing.depth = Math.min(existing.depth, module.depth)
      existing.layers.add(layer)
      existing.originalIndices.push(i)
    } else {
      moduleMap.set(displayPath, {
        type: moduleType,
        size: module.size,
        retainedSize: module.retainedSize,
        depth: module.depth,
        layers: new Set([layer]),
        imports: new Map(),
        importedBy: new Map(),
        originalIndices: [i],
      })
    }
  }

  // Second pass: build relationships with layer info
  for (let i = 0; i < graph.modules.length; i++) {
    const module = graph.modules[i]
    const sourcePath = indexToPath.get(i)
    if (!sourcePath) continue

    const sourceEntry = moduleMap.get(sourcePath)
    if (!sourceEntry) continue

    // Process imports
    for (const ref of module.references) {
      const targetPath = indexToPath.get(ref.index)
      if (targetPath && targetPath !== sourcePath) {
        const existingLayers = sourceEntry.imports.get(targetPath)
        if (existingLayers) {
          existingLayers.add(layer)
        } else {
          sourceEntry.imports.set(targetPath, new Set([layer]))
        }
      }
    }

    // Process imported by
    for (const ref of module.incomingReferences) {
      const importerPath = indexToPath.get(ref.index)
      if (importerPath && importerPath !== sourcePath) {
        const existingLayers = sourceEntry.importedBy.get(importerPath)
        if (existingLayers) {
          existingLayers.add(layer)
        } else {
          sourceEntry.importedBy.set(importerPath, new Set([layer]))
        }
      }
    }
  }

  return moduleMap
}

/** Merged module data without originalIndices */
interface MergedModuleData {
  type: 'userland' | 'external' | 'virtual'
  size: number
  retainedSize: number
  depth: number
  layers: Set<string>
  imports: Map<string, Set<string>>
  importedBy: Map<string, Set<string>>
}

/**
 * Merge module maps from multiple layers
 */
function mergeModuleMaps(
  maps: Map<string, InternalModuleData>[]
): Map<string, MergedModuleData> {
  const merged = new Map<string, MergedModuleData>()

  for (const map of maps) {
    for (const [path, data] of map) {
      const existing = merged.get(path)
      if (existing) {
        existing.size = Math.max(existing.size, data.size)
        existing.retainedSize = Math.max(existing.retainedSize, data.retainedSize)
        existing.depth = Math.min(existing.depth, data.depth)
        for (const layer of data.layers) existing.layers.add(layer)
        // Merge imports with layer info
        for (const [impPath, impLayers] of data.imports) {
          const existingImpLayers = existing.imports.get(impPath)
          if (existingImpLayers) {
            for (const l of impLayers) existingImpLayers.add(l)
          } else {
            existing.imports.set(impPath, new Set(impLayers))
          }
        }
        // Merge importedBy with layer info
        for (const [impByPath, impByLayers] of data.importedBy) {
          const existingImpByLayers = existing.importedBy.get(impByPath)
          if (existingImpByLayers) {
            for (const l of impByLayers) existingImpByLayers.add(l)
          } else {
            existing.importedBy.set(impByPath, new Set(impByLayers))
          }
        }
      } else {
        merged.set(path, {
          type: data.type,
          size: data.size,
          retainedSize: data.retainedSize,
          depth: data.depth,
          layers: new Set(data.layers),
          imports: new Map(
            Array.from(data.imports.entries()).map(([k, v]) => [k, new Set(v)])
          ),
          importedBy: new Map(
            Array.from(data.importedBy.entries()).map(([k, v]) => [k, new Set(v)])
          ),
        })
      }
    }
  }

  return merged
}

/**
 * Resolve a virtual module path (like app/client/data:23ad46) to its original source file
 */
function resolveVirtualModulePath(
  virtualPath: string,
  serverActionMap: Map<string, string[]>,
  projectPath: string
): string | undefined {
  // Check if this is a data: virtual module (Server Action)
  if (!virtualPath.includes('data:')) return undefined

  // Extract the directory part before data:
  // e.g., "app/client/data:23ad46" -> "app/client"
  const dataIndex = virtualPath.indexOf('data:')
  if (dataIndex <= 0) return undefined

  const dirPart = virtualPath.substring(0, dataIndex - 1) // -1 to remove trailing /

  // Try to find matching server action files
  for (const [actionDir, files] of serverActionMap) {
    // Check if the action directory ends with our dir part
    if (actionDir.endsWith(dirPart) || actionDir.includes(`/${dirPart}`)) {
      // If there's only one file in this directory, return it
      if (files.length === 1) {
        // Return relative path from project
        return files[0].replace(projectPath, '').replace(/^\//, '')
      }
      // If multiple files, return them all
      return files
        .map((f) => f.replace(projectPath, '').replace(/^\//, ''))
        .join(' | ')
    }
  }

  return undefined
}

/**
 * Convert Map<string, Set<string>> to ModuleReference[]
 */
function toModuleReferences(map: Map<string, Set<string>>): ModuleReference[] {
  return Array.from(map.entries()).map(([path, layers]) => ({
    path,
    layers: Array.from(layers),
  }))
}

/**
 * Build a refined module graph from endpoints
 */
async function buildRefinedGraph(
  route: string,
  routeType: string,
  endpoints: { layer: string; endpoint: Endpoint }[],
  projectPath: string,
  distDir: string
): Promise<RefinedModuleGraph> {
  const layerMaps: Map<string, InternalModuleData>[] = []
  const processedLayers: string[] = []

  for (const { layer, endpoint } of endpoints) {
    if (typeof endpoint.getModuleGraph !== 'function') continue

    try {
      const result = await endpoint.getModuleGraph()
      const graph = result as ModuleGraphSnapshot
      if (graph && graph.modules) {
        layerMaps.push(processGraphLayer(graph, layer, projectPath))
        processedLayers.push(layer)
      }
    } catch {
      // Skip layers that fail
    }
  }

  const merged = mergeModuleMaps(layerMaps)

  // Load server action manifest to resolve virtual module paths
  const serverActionMap = loadServerActionMap(distDir, route)

  // Convert to output format
  const modules: RefinedModule[] = []
  let userlandCount = 0
  let externalCount = 0
  let virtualCount = 0

  for (const [modulePath, data] of merged) {
    if (data.type === 'userland') userlandCount++
    else if (data.type === 'external') externalCount++
    else virtualCount++

    // For virtual modules, try to resolve original source path
    let source = modulePath
    let bundledAs: string | undefined

    if (data.type === 'virtual') {
      const originalPath = resolveVirtualModulePath(
        modulePath,
        serverActionMap,
        projectPath
      )
      if (originalPath) {
        source = originalPath
        bundledAs = modulePath
      }
    }

    const refinedModule: RefinedModule = {
      source,
      type: data.type,
      size: data.size,
      retainedSize: data.retainedSize,
      depth: data.depth,
      layers: Array.from(data.layers),
      imports: toModuleReferences(data.imports),
      importedBy: toModuleReferences(data.importedBy),
    }

    if (bundledAs) {
      refinedModule.bundledAs = bundledAs
    }

    modules.push(refinedModule)
  }

  // Sort: userland first (by depth), then external (by size), then virtual
  modules.sort((a, b) => {
    if (a.type !== b.type) {
      const order = { userland: 0, external: 1, virtual: 2 }
      return order[a.type] - order[b.type]
    }
    if (a.type === 'userland') return a.depth - b.depth
    return b.size - a.size
  })

  return {
    route,
    routeType,
    layers: processedLayers,
    summary: {
      totalModules: modules.length,
      userlandModules: userlandCount,
      externalPackages: externalCount,
      virtualModules: virtualCount,
      totalSize: modules.reduce((acc, m) => acc + m.size, 0),
    },
    modules,
  }
}

const PAGE_SIZE = 30

export function registerGetModuleGraphTool(
  server: McpServer,
  getTurbopackProject: () => Project | undefined,
  getCurrentEntrypoints: () => Entrypoints | undefined,
  getProjectPath: () => string,
  getDistDir: () => string
) {
  server.registerTool(
    'get_module_graph',
    {
      description:
        'Get the refined module dependency graph for a specific route. Returns userland modules, consolidated external packages, and bundle layer information. Only available when running with Turbopack.',
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
        const projectPath = getProjectPath()

        // Collect endpoints for this route with their layer names
        const endpoints: { layer: string; endpoint: Endpoint }[] = []
        let routeType = ''

        // Check App Router routes
        const appRoute = entrypoints.app.get(route)
        if (appRoute) {
          routeType = appRoute.type
          if (appRoute.type === 'app-page') {
            endpoints.push({ layer: 'server (RSC)', endpoint: appRoute.rscEndpoint })
            endpoints.push({ layer: 'client (HTML)', endpoint: appRoute.htmlEndpoint })
          } else if (appRoute.type === 'app-route') {
            endpoints.push({ layer: 'server', endpoint: appRoute.endpoint })
          }
        }

        // Check Pages Router routes
        if (endpoints.length === 0) {
          const pageRoute = entrypoints.page.get(route)
          if (pageRoute) {
            routeType = pageRoute.type
            if (pageRoute.type === 'page') {
              endpoints.push({ layer: 'server (HTML)', endpoint: pageRoute.htmlEndpoint })
              endpoints.push({ layer: 'client (Data)', endpoint: pageRoute.dataEndpoint })
            } else if (pageRoute.type === 'page-api') {
              endpoints.push({ layer: 'server', endpoint: pageRoute.endpoint })
            }
          }
        }

        if (endpoints.length === 0) {
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

        // Build the refined module graph
        const distDir = getDistDir()
        const refinedGraph = await buildRefinedGraph(
          route,
          routeType,
          endpoints,
          projectPath,
          distDir
        )

        if (refinedGraph.modules.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No userland modules found for route "${route}". The route may not have been compiled yet or only contains Next.js internals.`,
              },
            ],
          }
        }

        // Paginate modules
        const page = request.page ?? 0
        const startIndex = page * PAGE_SIZE
        const endIndex = Math.min(startIndex + PAGE_SIZE, refinedGraph.modules.length)
        const currentPageModules = refinedGraph.modules.slice(startIndex, endIndex)

        // Build structured output
        const output = {
          route: refinedGraph.route,
          routeType: refinedGraph.routeType,
          layers: refinedGraph.layers,
          summary: {
            ...refinedGraph.summary,
            totalSizeFormatted: formatBytes(refinedGraph.summary.totalSize),
          },
          pagination: {
            page,
            pageSize: PAGE_SIZE,
            totalModules: refinedGraph.modules.length,
            showing: `${startIndex + 1}-${endIndex}`,
            hasMore: endIndex < refinedGraph.modules.length,
          },
          modules: currentPageModules,
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2),
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
