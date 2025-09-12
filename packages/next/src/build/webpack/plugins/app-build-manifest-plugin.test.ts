// Mock webpack sources
jest.mock('next/dist/compiled/webpack/webpack', () => ({
  webpack: {},
  sources: {
    RawSource: jest.fn().mockImplementation((json) => ({
      source: () => json,
    })),
  },
}))

// Mock dependencies
jest.mock('../../../shared/lib/constants', () => ({
  APP_BUILD_MANIFEST: 'app-build-manifest.json',
  CLIENT_STATIC_FILES_RUNTIME_MAIN_APP: 'main-app',
  SYSTEM_ENTRYPOINTS: new Set(['main', 'main-app']),
}))

jest.mock('./build-manifest-plugin', () => ({
  getEntrypointFiles: jest.fn(),
}))

jest.mock('../../../server/get-app-route-from-entrypoint', () => jest.fn())

jest.mock('../../../lib/is-app-page-route', () => ({
  isAppPageRoute: jest.fn(),
}))

jest.mock('../../../lib/is-app-route-route', () => ({
  isAppRouteRoute: jest.fn(),
}))

// Import the main plugin after mocks
import { AppBuildManifestPlugin } from './app-build-manifest-plugin'

import { getEntrypointFiles } from './build-manifest-plugin'
import getAppRouteFromEntrypoint from '../../../server/get-app-route-from-entrypoint'
import { isAppPageRoute } from '../../../lib/is-app-page-route'
import { isAppRouteRoute } from '../../../lib/is-app-route-route'

const mockGetEntrypointFiles = getEntrypointFiles as jest.MockedFunction<
  typeof getEntrypointFiles
>
const mockGetAppRouteFromEntrypoint =
  getAppRouteFromEntrypoint as jest.MockedFunction<
    typeof getAppRouteFromEntrypoint
  >
const mockIsAppPageRoute = isAppPageRoute as jest.MockedFunction<
  typeof isAppPageRoute
>
const mockIsAppRouteRoute = isAppRouteRoute as jest.MockedFunction<
  typeof isAppRouteRoute
>

// Mock webpack compilation and entrypoints based on relisten-web debug output
function createMockEntrypoint(name: string, files: string[] = []) {
  return {
    name,
    chunks: [],
    getFiles: () => files,
  }
}

function createMockCompilation() {
  const entrypoints = new Map([
    // System entrypoints (should be skipped)
    ['main', createMockEntrypoint('main')],
    [
      'main-app',
      createMockEntrypoint('main-app', ['static/chunks/main-app-123.js']),
    ],

    // Route entrypoints (should be included)
    [
      'app/(browse)/page',
      createMockEntrypoint('app/(browse)/page', [
        'static/chunks/browse-page.js',
      ]),
    ],
    [
      'app/api/status/route',
      createMockEntrypoint('app/api/status/route', [
        'static/chunks/api-status.js',
      ]),
    ],
    [
      'app/album-art/route',
      createMockEntrypoint('app/album-art/route', [
        'static/chunks/album-art.js',
      ]),
    ],

    // Segment entrypoints (should NOT be included as separate entries)
    [
      'app/layout',
      createMockEntrypoint('app/layout', ['static/chunks/layout.js']),
    ],
    [
      'app/global-error',
      createMockEntrypoint('app/global-error', [
        'static/chunks/global-error.js',
      ]),
    ],
    [
      'app/(browse)/layout',
      createMockEntrypoint('app/(browse)/layout', [
        'static/chunks/browse-layout.js',
      ]),
    ],
    [
      'app/(browse)/@artists/default',
      createMockEntrypoint('app/(browse)/@artists/default', [
        'static/chunks/artists-default.js',
      ]),
    ],

    // System built-in entrypoints (should be skipped)
    [
      'next/dist/client/components/builtin/forbidden',
      createMockEntrypoint('next/dist/client/components/builtin/forbidden'),
    ],
  ])

  return {
    entrypoints,
    emitAsset: jest.fn(),
  }
}

describe('AppBuildManifestPlugin', () => {
  let plugin: AppBuildManifestPlugin
  let compilation: any

  beforeEach(() => {
    plugin = new AppBuildManifestPlugin()
    compilation = createMockCompilation()

    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock implementations
    mockGetEntrypointFiles.mockImplementation((entrypoint) => {
      return entrypoint?.getFiles() || []
    })

    mockGetAppRouteFromEntrypoint.mockImplementation((entryName) => {
      if (entryName.startsWith('app/')) {
        const route = entryName
          .replace(/^app\//, '')
          .replace(/(page|route)$/, '')
          .replace(/\/$/, '')
        return route === '' ? '/' : `/${route}`
      }
      return null
    })

    mockIsAppPageRoute.mockImplementation((route) => {
      return route.endsWith('/page')
    })

    mockIsAppRouteRoute.mockImplementation((route) => {
      return route.endsWith('/route')
    })
  })

  describe('createAsset', () => {
    it('should skip system entrypoints', () => {
      // @ts-ignore - accessing private method for testing
      plugin.createAsset(compilation)

      // Verify system entrypoints are skipped
      expect(mockGetAppRouteFromEntrypoint).not.toHaveBeenCalledWith('main')
      expect(mockGetAppRouteFromEntrypoint).not.toHaveBeenCalledWith('main-app')
    })

    it('should skip builtin Next.js components', () => {
      // @ts-ignore - accessing private method for testing
      plugin.createAsset(compilation)

      const [, assetSource] = compilation.emitAsset.mock.calls[0]
      const manifest = JSON.parse(assetSource.source())

      // Verify builtin components don't appear in final manifest
      expect(Object.keys(manifest.pages)).not.toContain('/builtin/forbidden')
    })

    it('should only include actual routes in manifest', () => {
      // Setup route detection mocks
      mockGetAppRouteFromEntrypoint.mockImplementation((entryName) => {
        switch (entryName) {
          case 'app/(browse)/page':
            return '/(browse)/page'
          case 'app/api/status/route':
            return '/api/status/route'
          case 'app/album-art/route':
            return '/album-art/route'
          case 'app/layout':
            return '/layout'
          case 'app/global-error':
            return '/global-error'
          case 'app/(browse)/layout':
            return '/(browse)/layout'
          case 'app/(browse)/@artists/default':
            return '/(browse)/@artists/default'
          default:
            return null
        }
      })

      mockIsAppPageRoute.mockImplementation((route) => {
        return route === '/(browse)/page'
      })

      mockIsAppRouteRoute.mockImplementation((route) => {
        return route === '/api/status/route' || route === '/album-art/route'
      })

      // @ts-ignore - accessing private method for testing
      plugin.createAsset(compilation)

      const [assetName, assetSource] = compilation.emitAsset.mock.calls[0]
      expect(assetName).toBe('app-build-manifest.json')

      const manifest = JSON.parse(assetSource.source())

      // Should only contain actual routes, not segments (sorted alphabetically)
      expect(Object.keys(manifest.pages).sort()).toEqual(
        ['/album-art/route', '/api/status/route', '/(browse)/page'].sort()
      )
    })

    it('should include main app files and route-specific files', () => {
      // Setup the compilation with a route that will be detected
      const testCompilation = {
        entrypoints: new Map([
          [
            'main-app',
            createMockEntrypoint('main-app', ['static/chunks/main-app-123.js']),
          ],
          [
            'app/(browse)/page',
            createMockEntrypoint('app/(browse)/page', [
              'static/chunks/browse-page.js',
            ]),
          ],
        ]),
        emitAsset: jest.fn(),
      }

      // Setup mocks for this test
      mockGetAppRouteFromEntrypoint.mockImplementation((entryName) => {
        if (entryName === 'app/(browse)/page') return '/(browse)/page'
        return null
      })
      mockIsAppPageRoute.mockImplementation(
        (route) => route === '/(browse)/page'
      )
      mockIsAppRouteRoute.mockReturnValue(false)

      // @ts-ignore - accessing private method for testing
      plugin.createAsset(testCompilation)

      const [, assetSource] = testCompilation.emitAsset.mock.calls[0]
      const manifest = JSON.parse(assetSource.source())

      // Check that routes include their main app files and their own files
      const browsePageFiles = manifest.pages['/(browse)/page']

      // Should include main app files
      expect(browsePageFiles).toContain('static/chunks/main-app-123.js')
      // Should include the page's own files
      expect(browsePageFiles).toContain('static/chunks/browse-page.js')
      // Should have at least these core files
      expect(browsePageFiles.length).toBeGreaterThanOrEqual(2)
    })

    it('should sort manifest keys alphabetically', () => {
      // Setup multiple routes in non-alphabetical order
      const unsortedCompilation = {
        entrypoints: new Map([
          ['main-app', createMockEntrypoint('main-app', ['main-app.js'])],
          [
            'app/zebra/page',
            createMockEntrypoint('app/zebra/page', ['zebra.js']),
          ],
          [
            'app/alpha/page',
            createMockEntrypoint('app/alpha/page', ['alpha.js']),
          ],
          [
            'app/beta/route',
            createMockEntrypoint('app/beta/route', ['beta.js']),
          ],
        ]),
        emitAsset: jest.fn(),
      }

      mockGetAppRouteFromEntrypoint.mockImplementation((entryName) => {
        switch (entryName) {
          case 'app/zebra/page':
            return '/zebra/page'
          case 'app/alpha/page':
            return '/alpha/page'
          case 'app/beta/route':
            return '/beta/route'
          default:
            return null
        }
      })

      mockIsAppPageRoute.mockImplementation((route) => route.endsWith('/page'))
      mockIsAppRouteRoute.mockImplementation((route) =>
        route.endsWith('/route')
      )

      // @ts-ignore - accessing private method for testing
      plugin.createAsset(unsortedCompilation)

      const [, assetSource] = unsortedCompilation.emitAsset.mock.calls[0]
      const manifest = JSON.parse(assetSource.source())

      // Keys should be sorted alphabetically
      expect(Object.keys(manifest.pages)).toEqual([
        '/alpha/page',
        '/beta/route',
        '/zebra/page',
      ])
    })
  })

  describe('isSegmentContributingToRoute', () => {
    it('should identify layout files as contributing', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute(
        'app/(browse)/layout',
        ['(browse)']
      )
      expect(result).toBe(true)
    })

    it('should identify error files as contributing', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute('app/(browse)/error', [
        '(browse)',
      ])
      expect(result).toBe(true)
    })

    it('should identify parallel route defaults as contributing', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute(
        'app/(browse)/@artists/default',
        ['(browse)']
      )
      expect(result).toBe(true)
    })

    it('should not identify non-special files as contributing', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute(
        'app/(browse)/some-file',
        ['(browse)']
      )
      expect(result).toBe(false)
    })

    it('should not identify segments from different routes as contributing', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute(
        'app/(content)/layout',
        ['(browse)']
      )
      expect(result).toBe(false)
    })

    it('should identify root layout as contributing to all routes', () => {
      // @ts-ignore - accessing private method for testing
      const result = plugin.isSegmentContributingToRoute('app/layout', [
        '(browse)',
        'artist',
      ])
      expect(result).toBe(true)
    })
  })
})
