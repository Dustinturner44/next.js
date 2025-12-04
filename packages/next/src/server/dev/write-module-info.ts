import { writeFile, mkdir, readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type {
  Entrypoints,
  Endpoint,
  ModuleGraphSnapshot,
} from '../../build/swc/types'

/**
 * Module layer information for the TS plugin and VS Code extension
 */
export interface ModuleLayerInfo {
  version: number
  timestamp: number
  modules: Record<
    string,
    {
      layers: string[] // All layers this file appears in
      routes: string[] // Routes that import this file
    }
  >
}

/**
 * Extract layer from module ident
 */
function extractLayerFromIdent(ident: string): string | null {
  const bracketMatches = ident.match(/\[([^\]]+)\]/g)
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const layerPart = match.slice(1, -1).toLowerCase()

      if (layerPart === 'project' || layerPart.includes('/')) continue

      if (layerPart.includes('client')) return 'client'
      if (layerPart.includes('ssr')) return 'client'
      if (layerPart.includes('rsc')) return 'server'
      if (layerPart.includes('action')) return 'action'
    }
  }

  const lowerIdent = ident.toLowerCase()
  if (lowerIdent.includes('server component')) return 'server'
  if (
    lowerIdent.includes('client component') ||
    lowerIdent.includes('client entry')
  )
    return 'client'
  if (lowerIdent.includes('server action')) return 'action'

  return null
}

/**
 * Check if a module path is a Next.js internal module
 */
function isNextInternal(modulePath: string): boolean {
  const internalPatterns = [
    '/packages/next/',
    '/dist/compiled/',
    '/next/dist/',
    'next/dist/',
    '[turbopack]/',
    '[externals]/',
    'node_modules/',
  ]
  const lowerPath = modulePath.toLowerCase()
  return internalPatterns.some((pattern) => lowerPath.includes(pattern))
}

/**
 * Check if path is a virtual module (server action)
 */
function isVirtualModule(path: string): boolean {
  return path.includes('data:')
}

/**
 * Get a clean relative path for userland modules
 */
function getCleanPath(modulePath: string): string {
  return modulePath
    .replace(/^\[project\]\//, '')
    .split('?')[0]
    .split('#')[0]
}

interface ModuleData {
  layers: Set<string>
  routes: Set<string>
}

/**
 * Extract directory from virtual module path
 * e.g., "[project]/app/sa/data:05f3fd" -> "app/sa"
 */
function getVirtualModuleDir(modulePath: string): string | null {
  const cleanPath = getCleanPath(modulePath)
  const dataIndex = cleanPath.indexOf('/data:')
  if (dataIndex <= 0) return null
  return cleanPath.substring(0, dataIndex)
}

/**
 * Process module graph and extract layer info for each module
 */
async function processEndpointGraph(
  endpoint: Endpoint,
  route: string,
  modules: Map<string, ModuleData>,
  serverActionDirs: Set<string>
): Promise<void> {
  if (typeof endpoint.getModuleGraph !== 'function') return

  try {
    const result = await endpoint.getModuleGraph()
    const graph = result as ModuleGraphSnapshot
    if (!graph || !graph.modules) return

    for (const module of graph.modules) {
      if (isNextInternal(module.path)) continue

      // Track directories with virtual modules (server actions)
      if (isVirtualModule(module.path)) {
        const dir = getVirtualModuleDir(module.path)
        if (dir) {
          serverActionDirs.add(dir)
        }
        continue
      }

      const cleanPath = getCleanPath(module.path)
      const layer = extractLayerFromIdent(module.ident)

      let data = modules.get(cleanPath)
      if (!data) {
        data = { layers: new Set(), routes: new Set() }
        modules.set(cleanPath, data)
      }

      if (layer) {
        data.layers.add(layer)
      }
      data.routes.add(route)
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Check if a file contains 'use server' directive
 */
async function isServerActionFile(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const firstLines = content.slice(0, 500) // Check first 500 chars
    return /['"]use server['"]/.test(firstLines)
  } catch {
    return false
  }
}

/**
 * Scan directories for server action files and add them to modules
 */
async function scanServerActionDirs(
  serverActionDirs: Set<string>,
  modules: Map<string, ModuleData>
): Promise<void> {
  // Use process.cwd() since module paths are relative to cwd
  const cwd = process.cwd()

  console.log('[module-layer] Scanning server action dirs:', Array.from(serverActionDirs))

  for (const dir of serverActionDirs) {
    const fullDir = join(cwd, dir)
    console.log('[module-layer] Scanning dir:', fullDir)
    try {
      const files = await readdir(fullDir)
      console.log('[module-layer] Found files:', files)
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx') &&
            !file.endsWith('.js') && !file.endsWith('.jsx')) {
          continue
        }

        const filePath = join(fullDir, file)
        const relativePath = join(dir, file)

        // Skip if already in modules
        if (modules.has(relativePath)) continue

        // Check if it's a server action file
        const isAction = await isServerActionFile(filePath)
        console.log('[module-layer] Checking file:', filePath, 'isAction:', isAction)
        if (isAction) {
          modules.set(relativePath, {
            layers: new Set(['action']),
            routes: new Set(['(server action)']),
          })
        }
      }
    } catch (e) {
      console.log('[module-layer] Error scanning dir:', fullDir, e)
    }
  }
}

/**
 * Write module layer information to .next/module-layer-info.json
 * This file is read by the VS Code extension to provide boundary information
 */
export async function writeModuleLayerInfo(
  distDir: string,
  entrypoints: Entrypoints
): Promise<void> {
  const modules = new Map<string, ModuleData>()
  const serverActionDirs = new Set<string>()

  // Process app router entries
  for (const [route, routeData] of entrypoints.app) {
    if (routeData.type === 'app-page') {
      await processEndpointGraph(routeData.rscEndpoint, route, modules, serverActionDirs)
      await processEndpointGraph(routeData.htmlEndpoint, route, modules, serverActionDirs)
    } else if (routeData.type === 'app-route') {
      await processEndpointGraph(routeData.endpoint, route, modules, serverActionDirs)
    }
  }

  // Process pages router entries
  for (const [route, routeData] of entrypoints.page) {
    if (routeData.type === 'page') {
      await processEndpointGraph(routeData.htmlEndpoint, route, modules, serverActionDirs)
      await processEndpointGraph(routeData.dataEndpoint, route, modules, serverActionDirs)
    } else if (routeData.type === 'page-api') {
      await processEndpointGraph(routeData.endpoint, route, modules, serverActionDirs)
    }
  }

  // Scan server action directories to find the actual source files
  await scanServerActionDirs(serverActionDirs, modules)

  // Convert to JSON-serializable format
  const modulesJson: Record<string, { layers: string[]; routes: string[] }> = {}
  for (const [path, data] of modules) {
    let layers = Array.from(data.layers)

    // If a file has both server and client layers, it's a client component (SSR'd)
    // Simplify to just "client"
    if (layers.includes('server') && layers.includes('client')) {
      layers = ['client']
    }

    modulesJson[path] = {
      layers,
      routes: Array.from(data.routes),
    }
  }

  const info: ModuleLayerInfo = {
    version: 2,
    timestamp: Date.now(),
    modules: modulesJson,
  }

  // Ensure .next directory exists
  await mkdir(distDir, { recursive: true })

  await writeFile(
    join(distDir, 'module-layer-info.json'),
    JSON.stringify(info, null, 2)
  )
}
