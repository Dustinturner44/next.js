import { TestingLogger } from 'next-test-utils'
import { Playwright } from './browsers/playwright'
import { setTimeout } from 'node:timers/promises'

const logger = new TestingLogger('waitForHydration')

const RETRY_DELAY = 100

interface NextWindow extends Window {
  __NEXT_HYDRATED?: boolean
  __NEXT_HYDRATED_CB?: () => void
  next?: {
    version: string
  }
}

export default async function waitForHydration<T>(
  page: Playwright<T>,
  url: string,
  options: { retry?: boolean } = {}
): Promise<void> {
  logger.debug(`Waiting hydration for ${url}`)

  const checkHydrated = async () => {
    await page.eval(() => {
      return new Promise<void>((callback) => {
        const win = window as NextWindow

        // if it's not a Next.js app return
        if (
          !document.documentElement.innerHTML.includes('__NEXT_DATA__') &&
          typeof win.next?.version === 'undefined'
        ) {
          console.log('Not a next.js page, resolving hydrate check')
          return callback()
        }

        // TODO: should we also ensure router.isReady is true
        // by default before resolving?
        if (win.__NEXT_HYDRATED) {
          console.log('Next.js page already hydrated')
          return callback()
        } else {
          const timeout = win.setTimeout(callback, 10_000)
          win.__NEXT_HYDRATED_CB = function () {
            win.clearTimeout(timeout)
            console.log('Next.js hydrate callback fired')
            callback()
          }
        }
      })
    })
  }

  try {
    await checkHydrated()
  } catch (err) {
    if (options.retry) {
      // re-try in case the page reloaded during check
      await setTimeout(RETRY_DELAY)
      await checkHydrated()
    } else {
      logger.error('Failed to check hydration', err as Error)
      throw err
    }
  }

  logger.debug(`Hydration complete for ${url}`)
}
