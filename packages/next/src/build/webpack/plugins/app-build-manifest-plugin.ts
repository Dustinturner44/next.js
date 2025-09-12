import { webpack, sources } from 'next/dist/compiled/webpack/webpack'
import {
  APP_BUILD_MANIFEST,
  CLIENT_STATIC_FILES_RUNTIME_MAIN_APP,
  SYSTEM_ENTRYPOINTS,
} from '../../../shared/lib/constants'
import { getEntrypointFiles } from './build-manifest-plugin'
import getAppRouteFromEntrypoint from '../../../server/get-app-route-from-entrypoint'
import { isAppPageRoute } from '../../../lib/is-app-page-route'
import { isAppRouteRoute } from '../../../lib/is-app-route-route'

export type AppBuildManifest = {
  pages: Record<string, string[]>
}

const PLUGIN_NAME = 'AppBuildManifestPlugin'

export class AppBuildManifestPlugin {
  public apply(compiler: any) {
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation: any) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => this.createAsset(compilation)
      )
    })
  }

  private createAsset(compilation: webpack.Compilation) {
    const manifest: AppBuildManifest = {
      pages: {},
    }

    const mainFiles = new Set(
      getEntrypointFiles(
        compilation.entrypoints.get(CLIENT_STATIC_FILES_RUNTIME_MAIN_APP)
      )
    )

    // First pass: collect all entrypoints and group them by route
    const allEntrypoints = new Map<string, any>()
    const routeToEntrypoints = new Map<string, Set<string>>()

    for (const entrypoint of compilation.entrypoints.values()) {
      if (!entrypoint.name || SYSTEM_ENTRYPOINTS.has(entrypoint.name)) {
        continue
      }

      const pagePath = getAppRouteFromEntrypoint(entrypoint.name)
      if (!pagePath) {
        continue
      }

      allEntrypoints.set(entrypoint.name, entrypoint)

      // Check if this is an actual route (page or route handler)
      const isRoute = isAppPageRoute(pagePath) || isAppRouteRoute(pagePath)

      if (isRoute) {
        // This is a route - it gets its own manifest entry
        if (!routeToEntrypoints.has(pagePath)) {
          routeToEntrypoints.set(pagePath, new Set())
        }
        routeToEntrypoints.get(pagePath)!.add(entrypoint.name)

        // Find all segments that contribute to this route
        this.collectContributingSegments(
          pagePath,
          entrypoint.name,
          allEntrypoints,
          routeToEntrypoints
        )
      }
    }

    // Second pass: generate manifest entries for each route
    for (const [routePath, entrypointNames] of routeToEntrypoints.entries()) {
      const allFiles = new Set([...mainFiles])

      for (const entrypointName of entrypointNames) {
        const entrypoint = allEntrypoints.get(entrypointName)
        if (entrypoint) {
          const filesForEntry = getEntrypointFiles(entrypoint)
          for (const file of filesForEntry) {
            allFiles.add(file)
          }
        }
      }

      manifest.pages[routePath] = Array.from(allFiles)
    }

    // Sort the keys to match turbopack behavior
    const sortedPages: Record<string, string[]> = {}
    Object.keys(manifest.pages)
      .sort()
      .forEach((key) => {
        sortedPages[key] = manifest.pages[key]
      })
    manifest.pages = sortedPages

    const json = JSON.stringify(manifest, null, 2)

    compilation.emitAsset(
      APP_BUILD_MANIFEST,
      new sources.RawSource(json) as unknown as webpack.sources.RawSource
    )
  }

  private collectContributingSegments(
    routePath: string,
    routeEntrypoint: string,
    allEntrypoints: Map<string, any>,
    routeToEntrypoints: Map<string, Set<string>>
  ) {
    // Extract the route directory path (remove the /page or /route suffix)
    const routePrefix = routeEntrypoint.replace(/\/(page|route)$/, '')
    const routeParts = routePrefix
      .replace(/^app\//, '')
      .split('/')
      .filter(Boolean)

    // Look for all segments that could contribute to this route
    for (const [entrypointName] of allEntrypoints.entries()) {
      if (entrypointName === routeEntrypoint) continue

      // Skip if it's already another route
      const otherPagePath = getAppRouteFromEntrypoint(entrypointName)
      if (
        otherPagePath &&
        (isAppPageRoute(otherPagePath) || isAppRouteRoute(otherPagePath))
      ) {
        continue
      }

      if (this.isSegmentContributingToRoute(entrypointName, routeParts)) {
        routeToEntrypoints.get(routePath)!.add(entrypointName)
      }
    }
  }

  private isSegmentContributingToRoute(
    segmentEntrypoint: string,
    routeParts: string[]
  ): boolean {
    // Remove 'app/' prefix and split into parts
    const segmentPath = segmentEntrypoint.replace(/^app\//, '')
    const segmentParts = segmentPath.split('/').filter(Boolean)

    if (segmentParts.length === 0) return false

    const lastSegment = segmentParts[segmentParts.length - 1]

    // Check if this is a special file that contributes to routes
    const specialFiles = [
      'layout',
      'loading',
      'error',
      'not-found',
      'global-error',
      'template',
      'default',
    ]
    const isSpecialFile = specialFiles.includes(lastSegment)

    // Check if this is a parallel route slot default (@slot/default)
    const isParallelRouteDefault =
      segmentParts.some((part) => part.startsWith('@')) &&
      lastSegment === 'default'

    if (!isSpecialFile && !isParallelRouteDefault) {
      return false
    }

    // Get the directory path of the segment (without the file name)
    const segmentDir = segmentParts.slice(0, -1)

    // For parallel routes, we need special handling
    if (segmentParts.some((part) => part.startsWith('@'))) {
      // This is within a parallel route - it contributes if it's in the route path or a parent
      const normalizedSegmentDir = segmentDir.filter(
        (part) => !part.startsWith('@')
      )
      return (
        normalizedSegmentDir.length <= routeParts.length &&
        normalizedSegmentDir.every((part, i) => routeParts[i] === part)
      )
    }

    // Regular special files contribute if they are at the same level or parent level of the route
    return (
      segmentDir.length <= routeParts.length &&
      segmentDir.every((part, i) => routeParts[i] === part)
    )
  }
}
