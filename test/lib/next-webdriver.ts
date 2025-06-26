import { getFullUrl, TestingLogger, waitFor } from 'next-test-utils'
import os from 'node:os'
import { Playwright, PlaywrightManager } from './browsers/playwright'
import { Page } from 'playwright'
import { BrowserManager } from './browser-manager'
import waitForHydration from './wait-for-hydration'

export type { Playwright, PlaywrightManager }

// Constants
const TURBOPACK_DELAY = 1_000
const DEFAULT_BROWSER = 'chrome'
const IPV4_FAMILY = 'IPv4' as const

interface GlobalWithBrowser {
  browserName: string
}

// Custom error classes
class BrowserSetupError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause })
    this.name = 'BrowserSetupError'
  }
}

if (!process.env.TEST_FILE_PATH) {
  process.env.TEST_FILE_PATH = module.parent!.filename
}

const logger = new TestingLogger('next-webdriver')

// Utility functions
function getDeviceIPv4Address(): string | undefined {
  const nets = os.networkInterfaces()
  for (const interfaces of Object.values(nets)) {
    const ipv4 = interfaces?.find(
      (item) => item.family === IPV4_FAMILY && !item.internal
    )
    if (ipv4) return ipv4.address
  }
  return undefined
}

let deviceIP: string | undefined
const isBrowserStack = !!process.env.BROWSERSTACK
;(global as GlobalWithBrowser & typeof globalThis).browserName =
  process.env.BROWSER_NAME || DEFAULT_BROWSER

if (isBrowserStack) {
  deviceIP = getDeviceIPv4Address()
  if (!deviceIP) {
    logger.warn('Could not detect IPv4 address for BrowserStack')
  }
}

export interface WebdriverOptions {
  /**
   * whether to wait for React hydration to finish
   */
  waitHydration?: boolean
  /**
   * allow retrying hydration wait if reload occurs
   */
  retryWaitHydration?: boolean
  /**
   * disable cache for page load
   */
  disableCache?: boolean
  /**
   * the callback receiving page instance before loading page
   * @param page
   * @returns
   */
  beforePageLoad?: (page: Page) => void
  /**
   * browser locale
   */
  locale?: string
  /**
   * disable javascript
   */
  disableJavaScript?: boolean
  headless?: boolean
  /**
   * ignore https errors
   */
  ignoreHTTPSErrors?: boolean
  cpuThrottleRate?: number
  pushErrorAsConsoleLog?: boolean

  /**
   * Override the user agent
   */
  userAgent?: string

  /**
   * The policy for tearing down the browser instance.
   * @default 'afterEach'
   */
  teardownPolicy?: 'afterEach' | 'afterAll' | 'none'
}

/**
 * Creates or reuses a browser instance for testing.
 *
 * The browser instance is managed as a singleton - multiple calls will reuse
 * the same browser instance for performance. The browser is automatically
 * cleaned up after all tests complete.
 *
 * @param appPortOrUrl can either be the port or the full URL
 * @param url the path/query to append when using appPort
 * @param options configuration options for the browser
 * @returns thenable browser instance with the loaded page
 */
export default async function webdriver(
  appPortOrUrl: string | number,
  url: string,
  options?: WebdriverOptions
): Promise<Playwright> {
  const defaultOptions = {
    waitHydration: true,
    retryWaitHydration: false,
    disableCache: false,
    teardownPolicy: 'afterEach',
  }
  const mergedOptions = Object.assign({}, defaultOptions, options)
  const {
    waitHydration,
    retryWaitHydration,
    disableCache,
    beforePageLoad,
    locale,
    disableJavaScript,
    ignoreHTTPSErrors,
    headless,
    cpuThrottleRate,
    pushErrorAsConsoleLog,
    userAgent,
    teardownPolicy,
  } = mergedOptions

  const browserName = process.env.BROWSER_NAME || DEFAULT_BROWSER
  ;(global as GlobalWithBrowser & typeof globalThis).browserName = browserName

  const fullUrl = getFullUrl(
    appPortOrUrl,
    url,
    isBrowserStack ? deviceIP : 'localhost'
  )

  try {
    logger.debug(`Loading browser with ${fullUrl}`)

    const playwright = await BrowserManager.getInstance({
      browserName,
      locale: locale || 'en-US',
      javaScriptEnabled: !disableJavaScript,
      ignoreHTTPSErrors: Boolean(ignoreHTTPSErrors),
      // allow headless to be overwritten for a particular test
      headless:
        typeof headless !== 'undefined' ? headless : !!process.env.HEADLESS,
      userAgent,
      teardownPolicy,
    })

    const page = await playwright.newPage(fullUrl, {
      disableCache,
      cpuThrottleRate,
      beforePageLoad,
      pushErrorAsConsoleLog,
    })
    logger.debug(`Loaded browser with ${fullUrl}`)

    // Wait for application to hydrate
    if (waitHydration) {
      try {
        await waitForHydration(page, fullUrl, { retry: retryWaitHydration })
      } catch (error) {
        throw new BrowserSetupError(
          'Failed to wait for hydration',
          error as Error
        )
      }
    }

    // This is a temporary workaround for turbopack starting watching too late.
    // So we delay file changes to give it some time
    // to connect the WebSocket and start watching.
    if (process.env.IS_TURBOPACK_TEST) {
      await waitFor(TURBOPACK_DELAY)
    }

    return page
  } catch (error) {
    const errorMessage = `Failed to setup browser for ${fullUrl}`
    logger.error(errorMessage, error as Error)
    throw new BrowserSetupError(errorMessage, error as Error)
  }
}
