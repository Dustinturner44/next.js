import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { retry } from 'next-test-utils'
import { launchStandaloneSession } from './test-utils'

describe('devtools-api get page metadata', () => {
  describe('app router', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(__dirname, 'fixtures', 'parallel-routes-template')
      ),
    })

    it('should return metadata for basic page', async () => {
      await next.browser('/')

      const response = await fetch(
        `${next.url}/_next/devtools-api/page-metadata`
      )
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.metadata).toBeDefined()
      const urls = Object.keys(data.metadata)
      expect(urls.length).toBeGreaterThan(0)

      const metadata = Object.values(data.metadata)[0]
      expect(metadata).toHaveProperty('routerType')
      expect(metadata).toHaveProperty('segmentTrie')
      expect(metadata.routerType).toBe('app')
    })

    it('should return metadata for parallel routes', async () => {
      await next.browser('/parallel')

      await retry(async () => {
        const response = await fetch(
          `${next.url}/_next/devtools-api/page-metadata`
        )
        expect(response.status).toBe(200)
        const data = await response.json()

        expect(data.metadata).toBeDefined()
        const urls = Object.keys(data.metadata)
        expect(urls.length).toBeGreaterThan(0)

        const url = urls[0]
        expect(url).toContain('/parallel')
      })
    })

    it('should handle multiple browser sessions', async () => {
      const session1 = await launchStandaloneSession(next.url, '/')
      const session2 = await launchStandaloneSession(next.url, '/parallel')

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        await retry(async () => {
          const response = await fetch(
            `${next.url}/_next/devtools-api/page-metadata`
          )
          expect(response.status).toBe(200)
          const data = await response.json()

          expect(data.metadata).toBeDefined()
          const urls = Object.keys(data.metadata)
          expect(urls.some((u) => u.includes('/'))).toBe(true)
          expect(urls.some((u) => u.includes('/parallel'))).toBe(true)
        })
      } finally {
        await session1.close()
        await session2.close()
      }
    })

    it('should handle no browser sessions', async () => {
      await next.stop()
      await next.start()

      const response = await fetch(
        `${next.url}/_next/devtools-api/page-metadata`
      )
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.message).toBe('No browser sessions connected.')
      expect(data.metadata).toEqual({})
    })
  })

  describe('pages router', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(__dirname, 'fixtures', 'pages-router-template')
      ),
    })

    it('should return metadata for pages router', async () => {
      await next.browser('/')

      await retry(async () => {
        const response = await fetch(
          `${next.url}/_next/devtools-api/page-metadata`
        )
        expect(response.status).toBe(200)
        const data = await response.json()

        expect(data.metadata).toBeDefined()
        const urls = Object.keys(data.metadata)
        expect(urls.length).toBeGreaterThan(0)
      })
    })
  })
})
