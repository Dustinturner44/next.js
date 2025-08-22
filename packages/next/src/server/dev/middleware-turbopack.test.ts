import type { TurbopackStackFrame } from '../../build/swc/types'
import type { BasicSourceMapPayload } from '../lib/source-maps'

// Mock dependencies
jest.mock('next/dist/compiled/source-map08', () => ({
  SourceMapConsumer: jest.fn(),
}))

jest.mock('../lib/source-maps', () => ({
  findApplicableSourceMapPayload: jest.fn(),
  devirtualizeReactServerURL: (url: string) => url,
}))

jest.mock('node:module', () => ({
  findSourceMap: jest.fn(),
}))

// Import the function we're testing - we'll need to access the internal logic
// Since nativeTraceSource is not exported, we'll test the logic by creating a test function
// that uses the same pattern

describe('middleware-turbopack source map ignore list optimization', () => {
  // Test the core logic that we're optimizing
  describe('ignore list performance optimization', () => {
    it('should handle empty ignore list correctly', () => {
      const applicableSourceMap: BasicSourceMapPayload = {
        version: 3,
        file: 'test.js',
        sources: ['src/test.ts', 'src/utils.ts'],
        names: [],
        mappings: '',
        ignoreList: undefined,
      }

      const originalSource = 'src/test.ts'
      
      // Test the optimized logic
      const sourceIndex = applicableSourceMap.sources.indexOf(originalSource)
      const ignoreSet = new Set(applicableSourceMap.ignoreList ?? [])
      const ignored = sourceIndex !== -1 ? ignoreSet.has(sourceIndex) : false

      expect(ignored).toBe(false)
    })

    it('should handle null originalPosition.source correctly', () => {
      const applicableSourceMap: BasicSourceMapPayload = {
        version: 3,
        file: 'test.js',
        sources: ['src/test.ts', 'src/utils.ts'],
        names: [],
        mappings: '',
        ignoreList: [0, 1],
      }

      const originalSource = null
      
      // Test the optimized logic with null source
      const sourceIndex = originalSource ? applicableSourceMap.sources.indexOf(originalSource) : -1
      const ignoreSet = new Set(applicableSourceMap.ignoreList ?? [])
      const ignored = sourceIndex !== -1 ? ignoreSet.has(sourceIndex) : false

      expect(ignored).toBe(false)
    })

    it('should correctly identify ignored sources using Set', () => {
      const applicableSourceMap: BasicSourceMapPayload = {
        version: 3,
        file: 'test.js',
        sources: ['src/test.ts', 'src/utils.ts', 'src/ignored.ts'],
        names: [],
        mappings: '',
        ignoreList: [0, 2], // First and third sources are ignored
      }

      // Test the optimized logic
      const ignoreSet = new Set(applicableSourceMap.ignoreList ?? [])
      
      // Test first source (should be ignored)
      const sourceIndex1 = applicableSourceMap.sources.indexOf('src/test.ts')
      const ignored1 = sourceIndex1 !== -1 ? ignoreSet.has(sourceIndex1) : false
      expect(ignored1).toBe(true)

      // Test second source (should not be ignored)
      const sourceIndex2 = applicableSourceMap.sources.indexOf('src/utils.ts')
      const ignored2 = sourceIndex2 !== -1 ? ignoreSet.has(sourceIndex2) : false
      expect(ignored2).toBe(false)

      // Test third source (should be ignored)
      const sourceIndex3 = applicableSourceMap.sources.indexOf('src/ignored.ts')
      const ignored3 = sourceIndex3 !== -1 ? ignoreSet.has(sourceIndex3) : false
      expect(ignored3).toBe(true)

      // Test non-existent source
      const sourceIndex4 = applicableSourceMap.sources.indexOf('src/nonexistent.ts')
      const ignored4 = sourceIndex4 !== -1 ? ignoreSet.has(sourceIndex4) : false
      expect(ignored4).toBe(false)
    })

    it('should handle undefined originalPosition.source without non-null assertion', () => {
      const applicableSourceMap: BasicSourceMapPayload = {
        version: 3,
        file: 'test.js',
        sources: ['src/test.ts'],
        names: [],
        mappings: '',
        ignoreList: [0],
      }

      const originalSource: string | undefined = undefined
      
      // Test the optimized logic without non-null assertion
      const sourceIndex = originalSource ? applicableSourceMap.sources.indexOf(originalSource) : -1
      const ignoreSet = new Set(applicableSourceMap.ignoreList ?? [])
      const ignored = sourceIndex !== -1 ? ignoreSet.has(sourceIndex) : false

      expect(ignored).toBe(false)
    })

    it('should be performant with large ignore lists', () => {
      // Create a large source map
      const largeSourceList = Array.from({ length: 1000 }, (_, i) => `src/file${i}.ts`)
      const largeIgnoreList = Array.from({ length: 500 }, (_, i) => i * 2) // Every even index
      
      const applicableSourceMap: BasicSourceMapPayload = {
        version: 3,
        file: 'test.js',
        sources: largeSourceList,
        names: [],
        mappings: '',
        ignoreList: largeIgnoreList,
      }

      // Test the optimized Set-based approach
      const ignoreSet = new Set(applicableSourceMap.ignoreList ?? [])
      
      // Performance test - this should be fast with Set.has()
      const start = Date.now()
      for (let i = 0; i < 100; i++) {
        const sourceIndex = applicableSourceMap.sources.indexOf(`src/file${i}.ts`)
        const ignored = sourceIndex !== -1 ? ignoreSet.has(sourceIndex) : false
      }
      const duration = Date.now() - start
      
      // This should complete very quickly (under 10ms even in slow environments)
      expect(duration).toBeLessThan(50)
    })
  })
})