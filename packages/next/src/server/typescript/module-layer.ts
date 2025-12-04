/**
 * Module layer API for the TypeScript plugin
 *
 * This module reads the module-layer-info.json file written by the dev server
 * and provides an API to query layer information for files.
 */

import * as fs from 'fs'
import * as path from 'path'

interface ModuleLayerCache {
  version: number
  timestamp: number
  modules: Record<
    string,
    {
      layer: 'server' | 'client' | 'action' | null
    }
  >
}

let cache: ModuleLayerCache | null = null
let lastMtime = 0
let nextDir: string | null = null

/**
 * Find the .next directory by walking up from startDir
 */
function findNextDir(startDir: string): string | null {
  let dir = startDir
  const root = path.parse(dir).root

  while (dir !== root) {
    const candidate = path.join(dir, '.next')
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate
      }
    } catch {
      // Ignore errors
    }
    dir = path.dirname(dir)
  }
  return null
}

/**
 * Find the module-layer-info.json file
 * It can be in .next/ or .next/dev/
 */
function findModuleLayerInfoPath(nextDir: string): string | null {
  const candidates = [
    path.join(nextDir, 'module-layer-info.json'),
    path.join(nextDir, 'dev', 'module-layer-info.json'),
  ]

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    } catch {
      // Ignore errors
    }
  }
  return null
}

/**
 * Reset the cache (useful for testing or when project changes)
 */
export function resetModuleLayerCache(): void {
  cache = null
  lastMtime = 0
  nextDir = null
}

export interface ModuleLayerResult {
  /** The layer this module belongs to */
  layer: 'server' | 'client' | 'action' | null
  /** True if this is a server component/module */
  isServer: boolean
  /** True if this is a client component/module */
  isClient: boolean
  /** True if this is a server action */
  isAction: boolean
}

/**
 * Get the layer information for a file
 *
 * @param filePath - Absolute path to the file
 * @returns Layer information or null if not found
 */
export function getModuleLayer(filePath: string): ModuleLayerResult | null {
  // Find .next dir if not cached
  if (!nextDir) {
    nextDir = findNextDir(path.dirname(filePath))
    if (!nextDir) return null
  }

  const infoPath = findModuleLayerInfoPath(nextDir)
  if (!infoPath) return null

  // Check mtime and reload if needed
  try {
    const stat = fs.statSync(infoPath)
    if (stat.mtimeMs > lastMtime) {
      const content = fs.readFileSync(infoPath, 'utf-8')
      cache = JSON.parse(content)
      lastMtime = stat.mtimeMs
    }
  } catch {
    return null
  }

  if (!cache) return null

  // Normalize the file path for matching
  let normalizedPath = filePath.replace(/\\/g, '/')

  // Try to find a matching module in the cache
  // The keys in cache might be relative paths from various roots
  for (const [modulePath, info] of Object.entries(cache.modules)) {
    // Check if the file path ends with the module path
    if (normalizedPath.endsWith(modulePath)) {
      return {
        layer: info.layer,
        isServer: info.layer === 'server',
        isClient: info.layer === 'client',
        isAction: info.layer === 'action',
      }
    }
    // Also check if module path ends with the relative part of filePath
    if (modulePath.endsWith(path.basename(normalizedPath))) {
      // More precise check - compare the last N segments
      const fileSegments = normalizedPath.split('/')
      const moduleSegments = modulePath.split('/')
      const minLen = Math.min(fileSegments.length, moduleSegments.length)

      let match = true
      for (let i = 1; i <= minLen; i++) {
        if (fileSegments[fileSegments.length - i] !== moduleSegments[moduleSegments.length - i]) {
          match = false
          break
        }
      }
      if (match) {
        return {
          layer: info.layer,
          isServer: info.layer === 'server',
          isClient: info.layer === 'client',
          isAction: info.layer === 'action',
        }
      }
    }
  }

  return null
}

/**
 * Get a human-readable label for the layer
 */
export function getLayerLabel(
  layer: 'server' | 'client' | 'action' | null
): string {
  switch (layer) {
    case 'server':
      return 'Server Component'
    case 'client':
      return 'Client Component'
    case 'action':
      return 'Server Action'
    default:
      return 'Unknown'
  }
}
