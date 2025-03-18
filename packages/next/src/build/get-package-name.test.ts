import { getPackageName } from './get-package-name'

describe('getPackageName', () => {
  describe('npm/yarn standard paths', () => {
    it('should extract regular package names', () => {
      expect(getPackageName('node_modules/react/index.js')).toBe('react')
      expect(getPackageName('node_modules/lodash/lib/index.js')).toBe('lodash')
      expect(getPackageName('node_modules/express/lib/express.js')).toBe(
        'express'
      )
    })

    it('should extract scoped package names', () => {
      expect(getPackageName('node_modules/@babel/core/lib/index.js')).toBe(
        '@babel/core'
      )
      expect(getPackageName('node_modules/@types/node/index.d.ts')).toBe(
        '@types/node'
      )
      expect(getPackageName('node_modules/@next/swc-darwin-x64/index.js')).toBe(
        '@next/swc-darwin-x64'
      )
    })

    it('should handle nested paths', () => {
      expect(getPackageName('/Users/project/node_modules/react/index.js')).toBe(
        'react'
      )
      expect(
        getPackageName('project/src/node_modules/@babel/core/lib/index.js')
      ).toBe('@babel/core')
    })
  })

  describe('pnpm .pnpm directory structure', () => {
    it('should extract from pnpm nested node_modules', () => {
      expect(
        getPackageName(
          'node_modules/.pnpm/react@18.0.0/node_modules/react/index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js'
        )
      ).toBe('lodash')
    })

    it('should extract scoped packages from pnpm paths', () => {
      expect(
        getPackageName(
          'node_modules/.pnpm/@babel+core@7.22.5/node_modules/@babel/core/lib/index.js'
        )
      ).toBe('@babel/core')
      expect(
        getPackageName(
          'node_modules/.pnpm/@types+node@20.0.0/node_modules/@types/node/index.d.ts'
        )
      ).toBe('@types/node')
      expect(
        getPackageName(
          'node_modules/.pnpm/@next+swc-darwin-x64@13.4.0/node_modules/@next/swc-darwin-x64/index.js'
        )
      ).toBe('@next/swc-darwin-x64')
    })

    it('should handle deep pnpm registry paths', () => {
      expect(
        getPackageName(
          'node_modules/.pnpm/registry.npmjs.org/react/18.0.0/node_modules/react/index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'node_modules/.pnpm/registry.npmjs.org/@babel+core/7.22.5/node_modules/@babel/core/lib/index.js'
        )
      ).toBe('@babel/core')
    })

    it('should handle pnpm paths with complex versions', () => {
      expect(
        getPackageName(
          'node_modules/.pnpm/react@18.0.0_react-dom@18.0.0/node_modules/react/index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'node_modules/.pnpm/@babel+core@7.22.5_@babel+types@7.22.5/node_modules/@babel/core/lib/index.js'
        )
      ).toBe('@babel/core')
    })
  })

  describe('multiple nested node_modules', () => {
    it('should use the last node_modules in the path', () => {
      expect(
        getPackageName(
          'project/node_modules/some-package/node_modules/react/index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'node_modules/workspace/node_modules/@babel/core/lib/index.js'
        )
      ).toBe('@babel/core')
    })

    it('should handle deep nesting with pnpm', () => {
      expect(
        getPackageName(
          'project/node_modules/.pnpm/workspace@1.0.0/node_modules/workspace/node_modules/react/index.js'
        )
      ).toBe('react')
    })
  })

  describe('edge cases', () => {
    it('should return null for paths without node_modules', () => {
      expect(getPackageName('src/components/Button.tsx')).toBe(null)
      expect(getPackageName('/Users/project/src/index.js')).toBe(null)
      expect(getPackageName('')).toBe(null)
    })

    it('should return null for malformed paths', () => {
      expect(getPackageName('node_modules/')).toBe(null)
      expect(getPackageName('node_modules/.pnpm/')).toBe(null)
      expect(getPackageName('node_modules/@')).toBe(null)
      expect(getPackageName('node_modules/@babel')).toBe(null)
    })

    it('should handle paths ending with node_modules', () => {
      expect(getPackageName('project/node_modules')).toBe(null)
    })

    it('should handle complex real-world pnpm paths', () => {
      // Real pnpm path examples
      expect(
        getPackageName(
          'node_modules/.pnpm/next@14.0.0_@babel+core@7.22.5_react-dom@18.0.0_react@18.0.0/node_modules/next/dist/lib/index.js'
        )
      ).toBe('next')
      expect(
        getPackageName(
          'node_modules/.pnpm/@swc+helpers@0.5.1/node_modules/@swc/helpers/lib/index.js'
        )
      ).toBe('@swc/helpers')
    })
  })

  describe('yarn pnp and other variations', () => {
    it('should handle yarn berry virtual paths', () => {
      // Yarn berry sometimes uses virtual paths but still has node_modules structure
      expect(
        getPackageName(
          '.yarn/cache/react-npm-18.0.0-virtual-abc123/node_modules/react/index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          '.yarn/cache/@babel-core-npm-7.22.5-virtual-def456/node_modules/@babel/core/lib/index.js'
        )
      ).toBe('@babel/core')
    })
  })

  describe('Windows path support', () => {
    it('should extract regular package names from Windows paths', () => {
      expect(getPackageName('node_modules\\react\\index.js')).toBe('react')
      expect(getPackageName('node_modules\\lodash\\lib\\index.js')).toBe(
        'lodash'
      )
      expect(
        getPackageName('C:\\project\\node_modules\\express\\lib\\express.js')
      ).toBe('express')
    })

    it('should extract scoped package names from Windows paths', () => {
      expect(getPackageName('node_modules\\@babel\\core\\lib\\index.js')).toBe(
        '@babel/core'
      )
      expect(getPackageName('node_modules\\@types\\node\\index.d.ts')).toBe(
        '@types/node'
      )
      expect(
        getPackageName(
          'C:\\Users\\project\\node_modules\\@next\\swc-win32-x64\\index.js'
        )
      ).toBe('@next/swc-win32-x64')
    })

    it('should handle pnpm paths on Windows', () => {
      expect(
        getPackageName(
          'node_modules\\.pnpm\\react@18.0.0\\node_modules\\react\\index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'node_modules\\.pnpm\\@babel+core@7.22.5\\node_modules\\@babel\\core\\lib\\index.js'
        )
      ).toBe('@babel/core')
      expect(
        getPackageName(
          'C:\\project\\node_modules\\.pnpm\\lodash@4.17.21\\node_modules\\lodash\\index.js'
        )
      ).toBe('lodash')
    })

    it('should handle mixed path separators', () => {
      // Mixed separators can happen in some environments
      expect(getPackageName('C:\\project/node_modules\\react/index.js')).toBe(
        'react'
      )
      expect(
        getPackageName(
          'node_modules/.pnpm\\@babel+core@7.22.5/node_modules\\@babel/core\\lib/index.js'
        )
      ).toBe('@babel/core')
    })

    it('should handle nested Windows paths', () => {
      expect(
        getPackageName(
          'C:\\project\\node_modules\\some-package\\node_modules\\react\\index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          'D:\\workspace\\node_modules\\.pnpm\\workspace@1.0.0\\node_modules\\workspace\\node_modules\\@babel\\core\\lib\\index.js'
        )
      ).toBe('@babel/core')
    })

    it('should return null for Windows paths without node_modules', () => {
      expect(getPackageName('C:\\project\\src\\components\\Button.tsx')).toBe(
        null
      )
      expect(getPackageName('D:\\workspace\\src\\index.js')).toBe(null)
    })

    it('should handle Windows UNC paths', () => {
      // Universal Naming Convention paths
      expect(
        getPackageName(
          '\\\\server\\share\\project\\node_modules\\react\\index.js'
        )
      ).toBe('react')
      expect(
        getPackageName(
          '\\\\network\\drive\\node_modules\\@babel\\core\\lib\\index.js'
        )
      ).toBe('@babel/core')
    })
  })
})
