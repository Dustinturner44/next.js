import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { retry } from 'next-test-utils'
import { chromium, firefox, webkit } from 'playwright'
import type { Browser } from 'playwright'

describe('devtools-api get errors', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'default-template')),
  })

  async function callGetErrors() {
    const response = await fetch(`${next.url}/_next/devtools-api/errors`)
    expect(response.status).toBe(200)
    return response.json()
  }

  it('should handle no browser sessions gracefully', async () => {
    const data = await callGetErrors()
    expect(data.message).toBe(
      'No browser sessions connected. Please open your application in a browser to retrieve error state.'
    )
    expect(data.hasErrors).toBe(false)
    expect(data.errors).toEqual({})
  })

  it('should return no errors for clean page', async () => {
    await next.browser('/')
    const data = await callGetErrors()
    expect(data.hasErrors).toBe(false)
    expect(data.errors).toBeDefined()
  })

  it('should capture runtime errors', async () => {
    const browser = await next.browser('/')
    await browser.elementByCss('a[href="/runtime-error"]').click()

    let data
    await retry(async () => {
      data = await callGetErrors()
      expect(data.hasErrors).toBe(true)
      expect(data.formatted).toContain('Runtime Errors')
    })

    expect(data.formatted).toContain('Test runtime error')
    expect(data.formatted).toContain('app/runtime-error/page.tsx')
  })

  it('should capture build errors when directly visiting error page', async () => {
    await next.browser('/build-error')

    let data
    await retry(async () => {
      data = await callGetErrors()
      expect(data.hasErrors).toBe(true)
      expect(data.formatted).toContain('Build Error')
    })
  })

  it('should capture errors from multiple browser sessions', async () => {
    await next.stop()
    await next.start()

    const [s1, s2] = await Promise.all([
      launchStandaloneSession(next.url, '/runtime-error'),
      launchStandaloneSession(next.url, '/runtime-error-2'),
    ])

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let data
      await retry(async () => {
        data = await callGetErrors()
        expect(data.hasErrors).toBe(true)
        expect(data.formatted).toContain('/runtime-error')
        expect(data.formatted).toContain('/runtime-error-2')
      })

      expect(data.formatted).toContain('Test runtime error')
      expect(data.formatted).toContain('Test runtime error 2')
    } finally {
      await s1.close()
      await s2.close()
    }
  })
})

async function launchStandaloneSession(
  appPortOrUrl: string | number,
  url: string
) {
  const headless = !!process.env.HEADLESS
  const browserName = (process.env.BROWSER_NAME || 'chrome').toLowerCase()

  let browser: Browser
  if (browserName === 'safari') {
    browser = await webkit.launch({ headless })
  } else if (browserName === 'firefox') {
    browser = await firefox.launch({ headless })
  } else {
    browser = await chromium.launch({ headless })
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  const fullUrl = getFullUrl(appPortOrUrl, url)

  await page.goto(fullUrl, { waitUntil: 'load' })

  return {
    page,
    close: async () => {
      await page.close().catch(() => {})
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    },
  }
}

function getFullUrl(appPortOrUrl: string | number, url: string): string {
  const appUrl =
    typeof appPortOrUrl === 'string'
      ? appPortOrUrl
      : `http://localhost:${appPortOrUrl}`
  return url.startsWith('/') ? `${appUrl}${url}` : url
}
