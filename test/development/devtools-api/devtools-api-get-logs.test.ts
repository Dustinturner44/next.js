import path from 'path'
import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'

describe('devtools-api get logs', () => {
  const { next, skipped } = nextTestSetup({
    files: path.join(__dirname, 'fixtures', 'log-file-app'),
    skipDeployment: true,
  })

  if (skipped) {
    return
  }

  it('should return log file path', async () => {
    await next.browser('/server')
    await next.browser('/client')
    await next.browser('/pages-router-page')

    await retry(async () => {
      const response = await fetch(`${next.url}/_next/devtools-api/logs`)
      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data.logFilePath).toBeDefined()
      expect(typeof data.logFilePath).toBe('string')
      expect(data.logFilePath.length).toBeGreaterThan(0)
      expect(data.logFilePath).toContain('next-development.log')
    })
  })
})
