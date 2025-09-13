import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { CLIENT_REFERENCE_MANIFEST } from '../shared/lib/constants'
import type { ClientReferenceManifest } from './webpack/plugins/flight-manifest-plugin'

export interface AppBuildManifestFromClientReferences {
  pages: Record<string, string[]>
}

/**
 * Extracts route-based manifest data from client reference manifests
 * This provides a more accurate representation of client-side bundle requirements
 * for React Server Components compared to the webpack plugin approach
 */
export function computeAppBuildManifestFromClientReferences(
  distPath: string
): AppBuildManifestFromClientReferences {
  const serverAppPath = join(distPath, 'server', 'app')

  if (!existsSync(serverAppPath)) {
    return { pages: {} }
  }

  const manifest: AppBuildManifestFromClientReferences = { pages: {} }
  const allFiles = new Set<string>()

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

  for (const manifestFile of manifestFiles) {
    try {
      // Read and parse the client reference manifest
      const content = readFileSync(manifestFile, 'utf8')

      // Extract the route from the global assignment
      const routeMatch = content.match(
        /globalThis\.__RSC_MANIFEST\["([^"]+)"\]\s*=\s*({.*})/
      )
      if (!routeMatch) continue

      const route = routeMatch[1]
      const manifestDataStr = routeMatch[2]

      // Parse the manifest data
      const manifestData: ClientReferenceManifest = JSON.parse(manifestDataStr)

      // Collect all chunks from client modules
      const chunks = new Set<string>()

      // Add chunks from client modules (these are the RSC client dependencies)
      // This is the key data - what client-side JS actually needs to be loaded
      for (const moduleInfo of Object.values(manifestData.clientModules)) {
        for (const chunk of moduleInfo.chunks) {
          chunks.add(chunk)
          allFiles.add(chunk)
        }
      }

      // Add CSS files if they exist
      if (manifestData.entryCSSFiles) {
        for (const cssFiles of Object.values(manifestData.entryCSSFiles)) {
          for (const cssFile of cssFiles) {
            chunks.add(cssFile.path)
            allFiles.add(cssFile.path)
          }
        }
      }

      // Store the route with all its required chunks
      manifest.pages[route] = Array.from(chunks).sort()
    } catch (error) {
      // Skip malformed manifest files
      console.warn(
        `Failed to parse client reference manifest: ${manifestFile}`,
        error
      )
      continue
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
