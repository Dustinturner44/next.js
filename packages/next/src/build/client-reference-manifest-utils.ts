import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { CLIENT_REFERENCE_MANIFEST } from '../shared/lib/constants'
import type { ClientReferenceManifest } from './webpack/plugins/flight-manifest-plugin'
import { normalizeAppPath } from '../shared/lib/router/utils/app-paths'

export interface AppBuildManifestFromClientReferences {
  pages: Record<string, string[]>
}

// Cache the computed manifest to avoid re-scanning filesystem
let cachedManifest: AppBuildManifestFromClientReferences | undefined
let cachedDistPath: string | undefined

/**
 * Normalizes chunk paths to handle differences between webpack and turbopack formats
 * Turbopack includes a configurable asset prefix (ending with /_next/) while webpack uses relative paths
 */
function normalizeChunkPath(chunkPath: string): string {
  // Strip asset prefix if present (turbopack format)
  // The asset prefix is configurable but always ends with /_next/
  let normalized = chunkPath
  const nextIndex = normalized.indexOf('/_next/')
  if (nextIndex !== -1) {
    normalized = normalized.slice(nextIndex + '/_next/'.length)
  }

  // Handle URL decoding for any escaped characters
  try {
    normalized = decodeURIComponent(normalized)
  } catch {
    // If decoding fails, use the original normalized path
  }

  return normalized
}

/**
 * Extracts route-based manifest data from client reference manifests
 * This provides a more accurate representation of client-side bundle requirements
 * for React Server Components compared to the webpack plugin approach
 */
export function computeAppBuildManifestFromClientReferences(
  distPath: string
): AppBuildManifestFromClientReferences {
  // Return cached result if available for the same distPath
  if (cachedManifest && cachedDistPath === distPath) {
    return cachedManifest
  }

  const serverAppPath = join(distPath, 'server', 'app')

  if (!existsSync(serverAppPath)) {
    const emptyManifest = { pages: {} }
    cachedManifest = emptyManifest
    cachedDistPath = distPath
    return emptyManifest
  }

  const manifest: AppBuildManifestFromClientReferences = { pages: {} }

  console.log(
    '[client-ref-manifest] Searching for manifests in:',
    serverAppPath
  )

  // Recursively find all client reference manifest files
  function findClientReferenceManifests(
    dir: string,
    relativePath = ''
  ): string[] {
    const files: string[] = []
    const items = readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(dir, item.name)
      const itemRelativePath = join(relativePath, item.name)

      if (item.isDirectory()) {
        files.push(...findClientReferenceManifests(fullPath, itemRelativePath))
      } else if (item.name.endsWith(`_${CLIENT_REFERENCE_MANIFEST}.js`)) {
        files.push(fullPath)
      }
    }

    return files
  }

  const manifestFiles = findClientReferenceManifests(serverAppPath)

  console.log(
    '[client-ref-manifest] Found manifest files:',
    manifestFiles.length
  )

  for (const manifestFile of manifestFiles) {
    try {
      // Read and parse the client reference manifest
      const content = readFileSync(manifestFile, 'utf8')

      // Extract the route from the global assignment
      const routeMatch = content.match(
        /globalThis\.__RSC_MANIFEST\["([^"]+)"\]\s*=\s*({.*})/
      )
      if (!routeMatch)
        throw new Error(
          `Unexpected content in client-reference-manifest file ${manifestFile}, cannot extract manifest`
        )

      const route = routeMatch[1]
      const manifestDataStr = routeMatch[2]

      console.log('[client-ref-manifest] Processing route:', route)

      // Parse the manifest data
      const manifestData: ClientReferenceManifest = JSON.parse(manifestDataStr)

      // Collect all chunks from client modules
      const chunks = new Set<string>()

      // Add chunks from client modules (these are the RSC client dependencies)
      // This is the key data - what client-side JS actually needs to be loaded
      for (const moduleInfo of Object.values(manifestData.clientModules)) {
        for (const chunk of moduleInfo.chunks) {
          chunks.add(normalizeChunkPath(chunk))
        }
      }

      // Add CSS files if they exist
      if (manifestData.entryCSSFiles) {
        for (const cssFiles of Object.values(manifestData.entryCSSFiles)) {
          for (const cssFile of cssFiles) {
            chunks.add(normalizeChunkPath(cssFile.path))
          }
        }
      }

      // Add entry JS files (turbopack specific - these are shared chunks)
      if (manifestData.entryJSFiles) {
        for (const jsFiles of Object.values(manifestData.entryJSFiles)) {
          for (const jsFile of jsFiles) {
            chunks.add(normalizeChunkPath(jsFile))
          }
        }
      }

      // Normalize the route path and store it with all its required chunks
      const normalizedRoute = normalizeAppPath(route)
      manifest.pages[normalizedRoute] = Array.from(chunks).sort()
    } catch (error) {
      // Skip malformed manifest files
      console.warn(
        `Failed to parse client reference manifest: ${manifestFile}`,
        error
      )
    }
  }

  // Sort route keys to match turbopack behavior
  const sortedPages: Record<string, string[]> = {}
  Object.keys(manifest.pages)
    .sort()
    .forEach((key) => {
      sortedPages[key] = manifest.pages[key]
    })
  manifest.pages = sortedPages

  // Cache the result
  cachedManifest = manifest
  cachedDistPath = distPath

  return manifest
}

/**
 * Get all unique files referenced across client reference manifests
 * Useful for analysis and debugging
 */
export function getAllReferencedFiles(distPath: string): Set<string> {
  const manifest = computeAppBuildManifestFromClientReferences(distPath)
  const allFiles = new Set<string>()

  for (const files of Object.values(manifest.pages)) {
    for (const file of files) {
      allFiles.add(file)
    }
  }

  return allFiles
}
