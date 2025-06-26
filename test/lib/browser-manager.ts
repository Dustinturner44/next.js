import { TestingLogger } from 'next-test-utils'
import type { PlaywrightManager } from './browsers/playwright'

const logger = new TestingLogger('browser-manager')

/**
 * Browser Manager for singleton instance management.
 */
export class BrowserManager {
  private static instance?: PlaywrightManager

  /**
   * Get the singleton instance of the browser. It will be closed after each
   * test.
   *
   * @param options - The options for the browser.
   * @returns The singleton instance of the browser.
   */
  static async getInstance(options: {
    browserName: string
    locale: string
    javaScriptEnabled: boolean
    ignoreHTTPSErrors: boolean
    headless: boolean
    userAgent?: string
    teardownPolicy: 'afterEach' | 'afterAll' | 'none'
  }): Promise<PlaywrightManager> {
    if (this.instance) {
      logger.debug('Reusing existing browser instance')
      return this.instance
    }

    logger.debug('Creating new browser instance')

    const { PlaywrightManager } = await import('./browsers/playwright')

    const instance = (this.instance = await PlaywrightManager.setup(
      options.browserName,
      options.locale,
      options.javaScriptEnabled,
      options.ignoreHTTPSErrors,
      options.headless,
      options.userAgent
    ))

    switch (options.teardownPolicy) {
      case 'afterEach':
        this.afterEachCallbacks.push(async () => {
          await instance.closeContext()
        })
        this.afterAllCallbacks.push(async () => {
          await instance.close()
          this.instance = undefined
        })
        break
      case 'afterAll':
        this.afterAllCallbacks.push(async () => {
          await instance.closeContext()
          await instance.close()
          this.instance = undefined
        })
        break
      default:
        break
    }

    return instance
  }

  /**
   * Close the singleton instance of the browser (if it exists).
   */
  private static afterEachCallbacks: (() => Promise<void>)[] = []
  static async afterEach(): Promise<void> {
    if (!this.afterEachCallbacks.length) return

    logger.debug('Closing browser context')

    try {
      const results = await Promise.allSettled(
        this.afterEachCallbacks.map((cb) => cb())
      )
      const rejected = results.filter((r) => r.status === 'rejected')
      if (rejected.length > 0) {
        throw new Error(
          `Failed to close browser instance: ${rejected
            .map((r) => r.reason)
            .join(', ')}`
        )
      }
    } catch (error) {
      logger.error('Failed to close browser instance', error as Error)
    } finally {
      this.afterEachCallbacks = []
    }
  }

  private static afterAllCallbacks: (() => Promise<void>)[] = []
  static async afterAll(): Promise<void> {
    if (!this.afterAllCallbacks.length) return

    logger.debug('Closing browser instance')

    try {
      const results = await Promise.allSettled(
        this.afterAllCallbacks.map((cb) => cb())
      )
      const rejected = results.filter((r) => r.status === 'rejected')
      if (rejected.length > 0) {
        throw new Error(
          `Failed to close browser instance: ${rejected
            .map((r) => r.reason)
            .join(', ')}`
        )
      }
    } catch (error) {
      logger.error('Failed to close browser instance', error as Error)
    } finally {
      this.afterAllCallbacks = []
    }
  }
}

// Register cleanup at module scope if afterEach is available
if (typeof afterEach === 'function') {
  afterEach(async () => {
    await BrowserManager.afterEach()
  })
}

// Register cleanup at module scope if afterAll is available
if (typeof afterAll === 'function') {
  afterAll(async () => {
    await BrowserManager.afterAll()
  })
}
