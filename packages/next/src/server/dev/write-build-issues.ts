import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type {
  Entrypoints,
  Endpoint,
  ModuleGraphSnapshot,
} from '../../build/swc/types'

export interface BuildIssue {
  /** File path relative to project root */
  file: string
  /** Line number (1-indexed) */
  line: number
  /** Column number (1-indexed) */
  column: number
  /** Issue message */
  message: string
  /** Issue severity */
  severity: 'error' | 'warning' | 'info'
  /** Issue code for identification */
  code: string
}

export interface BuildIssuesFile {
  version: number
  timestamp: number
  issues: BuildIssue[]
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
  ]
  const lowerPath = modulePath.toLowerCase()
  return internalPatterns.some((pattern) => lowerPath.includes(pattern))
}

/**
 * Get a clean relative path for modules
 */
function getCleanPath(modulePath: string): string {
  return modulePath
    .replace(/^\[project\]\//, '')
    .split('?')[0]
    .split('#')[0]
}

/**
 * Extract package info from node_modules path
 */
function getPackageInfo(modulePath: string): { name: string; version?: string } | null {
  // Handle pnpm's nested structure
  // e.g., node_modules/.pnpm/uuid@9.0.0/node_modules/uuid
  const pnpmMatch = modulePath.match(
    /node_modules\/\.pnpm\/([^/]+)\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/
  )
  if (pnpmMatch) {
    const pnpmPart = pnpmMatch[1]
    const packageName = pnpmMatch[2]
    let version: string | undefined
    // Extract version from pnpm part (e.g., "uuid@9.0.0" or "@babel+core@7.20.0")
    const versionMatch = pnpmPart.match(/@(\d+\.\d+\.\d+[^_/]*)/)
    if (versionMatch) {
      version = versionMatch[1]
    }
    return { name: packageName, version }
  }

  // Standard node_modules
  const nodeModulesMatch = modulePath.match(
    /node_modules\/(@[^/]+\/[^/]+|[^/]+)/
  )
  if (!nodeModulesMatch) return null

  const packageName = nodeModulesMatch[1]
  if (packageName === '.pnpm') return null

  return { name: packageName }
}

/**
 * Get module type from path
 */
function getModuleType(
  modulePath: string
): 'userland' | 'external' | 'internal' {
  if (isNextInternal(modulePath)) return 'internal'
  if (modulePath.includes('node_modules/')) return 'external'
  return 'userland'
}

/**
 * Analyze module graph for issues like duplicate packages
 * Returns: Map of package key (name@version) -> { files that use this package }
 */
async function analyzeEndpointGraph(
  endpoint: Endpoint,
  route: string,
  externalModules: Map<string, { depth: number; version?: string }>,
  userlandFiles: Set<string>,
  userlandImports: Map<string, Set<string>>
): Promise<void> {
  if (typeof endpoint.getModuleGraph !== 'function') return

  try {
    const result = await endpoint.getModuleGraph()
    const graph = result as ModuleGraphSnapshot
    if (!graph || !graph.modules) return

    // Build index -> path mapping
    const indexToDisplayPath = new Map<number, string>()

    for (let i = 0; i < graph.modules.length; i++) {
      const module = graph.modules[i]
      const moduleType = getModuleType(module.path)

      if (moduleType === 'internal') continue

      let displayPath: string
      if (moduleType === 'external') {
        const packageInfo = getPackageInfo(module.path)
        if (!packageInfo) continue
        // Include version in key to track different versions separately
        displayPath = packageInfo.version
          ? `${packageInfo.name}@${packageInfo.version}`
          : packageInfo.name

        // Track external modules with their metadata
        const existing = externalModules.get(displayPath)
        if (!existing || module.depth < existing.depth) {
          externalModules.set(displayPath, {
            depth: module.depth,
            version: packageInfo.version,
          })
        }
      } else {
        displayPath = getCleanPath(module.path)
        userlandFiles.add(displayPath)
      }

      indexToDisplayPath.set(i, displayPath)
    }

    // Second pass: track which userland files import which external packages
    for (let i = 0; i < graph.modules.length; i++) {
      const module = graph.modules[i]
      const sourcePath = indexToDisplayPath.get(i)
      if (!sourcePath) continue

      // Only track imports from userland files
      if (!userlandFiles.has(sourcePath)) continue

      for (const ref of module.references) {
        const targetPath = indexToDisplayPath.get(ref.index)
        if (!targetPath) continue

        // Check if target is an external module
        if (externalModules.has(targetPath)) {
          const imports = userlandImports.get(sourcePath) || new Set()
          imports.add(targetPath)
          userlandImports.set(sourcePath, imports)
        }
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Analyze entrypoints and write detected issues to .next/dev/build-issues.json
 */
export async function writeBuildIssues(
  distDir: string,
  entrypoints: Entrypoints
): Promise<void> {
  // Track all external modules (package@version -> metadata)
  const externalModules = new Map<string, { depth: number; version?: string }>()
  // Track all userland files
  const userlandFiles = new Set<string>()
  // Track which userland files import which external packages
  const userlandImports = new Map<string, Set<string>>()

  // Process app router entries
  for (const [route, routeData] of entrypoints.app) {
    if (routeData.type === 'app-page') {
      await analyzeEndpointGraph(routeData.rscEndpoint, route, externalModules, userlandFiles, userlandImports)
      await analyzeEndpointGraph(routeData.htmlEndpoint, route, externalModules, userlandFiles, userlandImports)
    } else if (routeData.type === 'app-route') {
      await analyzeEndpointGraph(routeData.endpoint, route, externalModules, userlandFiles, userlandImports)
    }
  }

  // Process pages router entries
  for (const [route, routeData] of entrypoints.page) {
    if (routeData.type === 'page') {
      await analyzeEndpointGraph(routeData.htmlEndpoint, route, externalModules, userlandFiles, userlandImports)
      await analyzeEndpointGraph(routeData.dataEndpoint, route, externalModules, userlandFiles, userlandImports)
    } else if (routeData.type === 'page-api') {
      await analyzeEndpointGraph(routeData.endpoint, route, externalModules, userlandFiles, userlandImports)
    }
  }

  // Detect duplicate packages (same base name, different versions)
  const packageVersions = new Map<string, string[]>()
  for (const key of externalModules.keys()) {
    // Extract base package name from key (e.g., "uuid@9.0.0" -> "uuid")
    const atIndex = key.lastIndexOf('@')
    if (atIndex > 0) {
      const baseName = key.slice(0, atIndex)
      const version = key.slice(atIndex + 1)
      const versions = packageVersions.get(baseName) || []
      if (!versions.includes(version)) {
        versions.push(version)
      }
      packageVersions.set(baseName, versions)
    }
  }

  const issues: BuildIssue[] = []

  // Create issues for duplicate packages
  for (const [baseName, versions] of packageVersions) {
    if (versions.length > 1) {
      const sortedVersions = versions.sort()

      // Find files that directly import any version of this package
      for (const [file, imports] of userlandImports) {
        const importsThisPackage = Array.from(imports).some(
          imp => imp.startsWith(baseName + '@')
        )

        if (importsThisPackage) {
          issues.push({
            file,
            line: 1,
            column: 1,
            message: `Duplicate package "${baseName}" detected: versions ${sortedVersions.join(', ')}. This increases bundle size and may cause runtime issues.`,
            severity: 'warning',
            code: 'duplicate-package',
          })
        }
      }
    }
  }

  const issuesFile: BuildIssuesFile = {
    version: 1,
    timestamp: Date.now(),
    issues,
  }

  // Write to distDir/build-issues.json
  // Note: In dev mode with isolatedDevBuild, distDir is already .next/dev
  await mkdir(distDir, { recursive: true })
  await writeFile(
    join(distDir, 'build-issues.json'),
    JSON.stringify(issuesFile, null, 2)
  )
}
