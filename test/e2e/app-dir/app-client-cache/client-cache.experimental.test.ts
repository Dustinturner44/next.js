import { nextTestSetup } from 'e2e-utils'
import { createRouterAct } from 'router-act'
import { browserConfigWithFixedTime, fastForwardTo } from './test-utils'
import { findAllTelemetryEvents } from 'next-test-utils'
import path from 'path'

describe('app dir client cache semantics (experimental staleTimes)', () => {
  describe('dynamic: 0', () => {
    const { next, isNextDev, isNextDeploy } = nextTestSetup({
      files: path.join(__dirname, 'fixtures', 'regular'),
      nextConfig: {
        experimental: { staleTimes: { dynamic: 0 } },
      },
      env: {
        NEXT_TELEMETRY_DEBUG: '1',
      },
    })

    if (isNextDev) {
      // dev doesn't support prefetch={true}, so this just performs a basic test to make sure data is fresh on each navigation
      it('should trigger a loading state before fetching the page, followed by fresh data on every subsequent navigation', async () => {
        const browser = await next.browser('/', browserConfigWithFixedTime)

        // Toggle and navigate - this test introduces an artificial delay in rendering the requested page, so we verify a loading state is rendered
        await browser
          .elementByCss('[data-link-accordion="/1?timeout=1000"]')
          .click()
        await browser.elementByCss('[href="/1?timeout=1000"]').click()
        await browser.waitForElementByCss('#loading')

        const initialRandomNumber = await browser
          .waitForElementByCss('#random-number')
          .text()

        await browser.elementByCss('[data-link-accordion="/"]').click()
        await browser.elementByCss('[href="/"]').click()

        await browser.eval(fastForwardTo, 5 * 1000) // fast forward 5 seconds

        await browser
          .elementByCss('[data-link-accordion="/1?timeout=1000"]')
          .click()
        const newRandomNumber = await browser
          .elementByCss('[href="/1?timeout=1000"]')
          .click()
          .waitForElementByCss('#random-number')
          .text()

        expect(initialRandomNumber).not.toBe(newRandomNumber)
      })

      describe('without a loading boundary', () => {
        it('should get fresh data on every subsequent navigation', async () => {
          const browser = await next.browser(
            '/without-loading',
            browserConfigWithFixedTime
          )

          // reveal the link
          await browser
            .elementByCss(
              '[data-link-accordion="/without-loading/1?timeout=1000"]'
            )
            .click()
          // navigate
          const initialRandomNumber = await browser
            .elementByCss('[href="/without-loading/1?timeout=1000"]')
            .click()
            .waitForElementByCss('#random-number')
            .text()

          // reveal the home link
          await browser
            .elementByCss('[data-link-accordion="/without-loading"]')
            .click()
          // navigate to the home page
          await browser.elementByCss('[href="/without-loading"]').click()

          // reveal link back to the target page
          await browser
            .elementByCss(
              '[data-link-accordion="/without-loading/1?timeout=1000"]'
            )
            .click()

          const newRandomNumber = await browser
            .elementByCss('[href="/without-loading/1?timeout=1000"]')
            .click()
            .waitForElementByCss('#random-number')
            .text()

          expect(initialRandomNumber).not.toBe(newRandomNumber)
        })
      })

      return
    }

    describe('prefetch={true}', () => {
      it('should re-use the cache for 5 minutes (default "static" time)', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle link to trigger prefetch
        const link = await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/0?timeout=0"]'
            )
            await reveal.click()
            return browser.elementByCss('[href="/0?timeout=0"]')
          },
          { includes: 'random-number' }
        )

        // Navigate - should use prefetch
        let initialRandomNumber = await act(async () => {
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Navigate back - should use cache
        let newRandomNumber = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/0?timeout=0"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/0?timeout=0"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).toBe(newRandomNumber)

        await browser.eval(fastForwardTo, 30 * 1000) // fast forward 30 seconds

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back - still cached
        newRandomNumber = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/0?timeout=0"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/0?timeout=0"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).toBe(newRandomNumber)

        await browser.eval(fastForwardTo, 5 * 60 * 1000) // fast forward 5 minutes

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Toggle link - should trigger new prefetch after expiry
        const linkAfterExpiry = await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/0?timeout=0"]'
            )
            await reveal.click()
            return browser.elementByCss('[href="/0?timeout=0"]')
          },
          { includes: 'random-number' }
        )

        // Navigate - should use fresh prefetch
        newRandomNumber = await act(async () => {
          await linkAfterExpiry.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).not.toBe(newRandomNumber)
      })
    })

    describe('prefetch={false}', () => {
      it('should trigger a loading state before fetching the page, followed by fresh data on every subsequent navigation', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle link - should NOT trigger prefetch
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/2?timeout=1000"]'
          )
          await reveal.click()
        }, 'no-requests')

        // Navigate - should fetch page. There was no prefetched loading state, so we won't see it until the dynamic request starts streaming.
        // we can't use `act` here because it will wait for the request to finish, but that will be too late since we'll have
        // shown the full response already.
        await browser.elementByCss('[href="/2?timeout=1000"]').click()
        await browser.waitForElementByCss('#loading')

        const initialRandomNumber = await browser.elementByCss('#random-number')

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        await browser.eval(fastForwardTo, 5 * 1000) // fast forward 5 seconds

        // Navigate back - should fetch fresh data (no cache with dynamic: 0)
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/2?timeout=1000"]'
            )
            await reveal.click()
            const link = await browser.elementByCss('[href="/2?timeout=1000"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const newRandomNumber = await browser
          .elementByCss('#random-number')
          .text()

        expect(initialRandomNumber).not.toBe(newRandomNumber)
      })

      describe('without a loading boundary', () => {
        it('should get fresh data on every subsequent navigation', async () => {
          let act: ReturnType<typeof createRouterAct>
          const browser = await next.browser('/', {
            beforePageLoad(page) {
              browserConfigWithFixedTime.beforePageLoad(page)
              act = createRouterAct(page)
            },
          })

          // Toggle link - should NOT trigger prefetch
          await act(async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/2?timeout=1000"]'
            )
            await reveal.click()
          }, 'no-requests')

          // Navigate - should fetch page. There was no prefetched loading state, so we won't see it until the dynamic request starts streaming.
          // we can't use `act` here because it will wait for the request to finish, but that will be too late since we'll have
          // shown the full response already.
          await browser.elementByCss('[href="/2?timeout=1000"]').click()
          await browser.waitForElementByCss('#loading')

          const initialRandomNumber =
            await browser.elementByCss('#random-number')

          // Navigate home
          await act(async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/"]'
            )
            await reveal.click()
            const homeLink = await browser.elementByCss('[href="/"]')
            await homeLink.click()
          })

          await browser.eval(fastForwardTo, 5 * 1000) // fast forward 5 seconds

          // Navigate back - should fetch fresh data
          await act(
            async () => {
              const reveal = await browser.elementByCss(
                '[data-link-accordion="/2?timeout=1000"]'
              )
              await reveal.click()
              const link = await browser.elementByCss(
                '[href="/2?timeout=1000"]'
              )
              await link.click()
            },
            { includes: 'random-number' }
          )

          const newRandomNumber = await browser
            .elementByCss('#random-number')
            .text()

          expect(initialRandomNumber).not.toBe(newRandomNumber)
        })
      })
    })

    describe('prefetch={undefined} - default', () => {
      it('should trigger a loading state before fetching the page, followed by fresh data on every subsequent navigation', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle link - should trigger partial prefetch (loading boundary)
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate - should fetch full page and show loading
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
            await browser.waitForElementByCss('#loading')
          },
          { includes: 'random-number' }
        )

        const initialRandomNumber = await browser.elementByCss('#random-number')

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        await browser.eval(fastForwardTo, 5 * 1000) // fast forward 5 seconds

        // Navigate back - should fetch fresh data (no cache with dynamic: 0)
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const newRandomNumber = await browser
          .elementByCss('#random-number')
          .text()

        expect(initialRandomNumber).not.toBe(newRandomNumber)
      })

      describe('without a loading boundary', () => {
        it('should get fresh data on every subsequent navigation', async () => {
          let act: ReturnType<typeof createRouterAct>
          const browser = await next.browser('/without-loading', {
            beforePageLoad(page) {
              browserConfigWithFixedTime.beforePageLoad(page)
              act = createRouterAct(page)
            },
          })

          await act(
            async () => {
              const reveal = await browser.elementByCss(
                '[data-link-accordion="/without-loading/1?timeout=1000"]'
              )
              await reveal.click()
              const link = await browser.elementByCss(
                '[href="/without-loading/1?timeout=1000"]'
              )
              await link.click()
            },
            { includes: 'random-number' }
          )

          const initialRandomNumber =
            await browser.elementByCss('#random-number')

          await act(async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/without-loading"]'
            )
            await reveal.click()
            const link = await browser.elementByCss('[href="/without-loading"]')
            await link.click()
          })

          await act(
            async () => {
              const reveal = await browser.elementByCss(
                '[data-link-accordion="/without-loading/1?timeout=1000"]'
              )
              await reveal.click()
              const link = await browser.elementByCss(
                '[href="/without-loading/1?timeout=1000"]'
              )
              await link.click()
            },
            { includes: 'random-number' }
          )

          const newRandomNumber = await browser
            .elementByCss('#random-number')
            .text()

          expect(initialRandomNumber).not.toBe(newRandomNumber)
        })
      })
    })

    if (!isNextDeploy) {
      describe('telemetry', () => {
        it('should send staleTimes feature usage event', async () => {
          const events = findAllTelemetryEvents(
            next.cliOutput,
            'NEXT_CLI_SESSION_STARTED'
          )

          expect(events).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                staticStaleTime: null,
                dynamicStaleTime: 0,
              }),
            ])
          )
        })
      })
    }
  })

  describe('static: 180', () => {
    const { next, isNextDev, isNextDeploy } = nextTestSetup({
      files: path.join(__dirname, 'fixtures', 'regular'),
      nextConfig: {
        experimental: { staleTimes: { static: 180 } },
      },
      env: {
        NEXT_TELEMETRY_DEBUG: '1',
      },
    })

    if (isNextDev) {
      // since the router behavior is different in development mode (no viewport prefetching + liberal revalidation)
      // we only check the production behavior
      it('should skip dev', () => {})
      return
    }

    describe('prefetch={true}', () => {
      it('should use the custom static override time (3 minutes)', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle link to trigger prefetch
        const link = await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/0?timeout=0"]'
            )
            await reveal.click()
            return browser.elementByCss('[href="/0?timeout=0"]')
          },
          { includes: 'random-number' }
        )

        // Navigate - should use prefetch
        let initialRandomNumber = await act(async () => {
          await link.click()
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Navigate back - should use cache
        let newRandomNumber = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/0?timeout=0"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/0?timeout=0"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).toBe(newRandomNumber)

        await browser.eval(fastForwardTo, 30 * 1000) // fast forward 30 seconds

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back - still cached (within 3 min window)
        newRandomNumber = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/0?timeout=0"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/0?timeout=0"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).toBe(newRandomNumber)

        await browser.eval(fastForwardTo, 3 * 60 * 1000) // fast forward 3 minutes

        // Navigate home - cache expired
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Toggle link - should trigger new prefetch after expiry
        const linkAfterExpiry = await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/0?timeout=0"]'
            )
            await reveal.click()
            return browser.elementByCss('[href="/0?timeout=0"]')
          },
          { includes: 'random-number' }
        )

        // Navigate - should use fresh prefetch
        newRandomNumber = await act(async () => {
          await linkAfterExpiry.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(initialRandomNumber).not.toBe(newRandomNumber)
      })
    })

    describe('prefetch={undefined} - default', () => {
      it('should re-use the loading boundary for the custom static override time (3 minutes)', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle link - should trigger partial prefetch
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate
        const loadingRandomNumber = await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
            await browser.waitForElementByCss('#loading')
            return browser.elementByCss('#loading').text()
          },
          { includes: 'random-number' }
        )

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        await browser.eval(fastForwardTo, 2 * 60 * 1000) // fast forward 2 minutes

        // Navigate back - should still use cached loading (within 3 min window)
        let newLoadingNumber = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1?timeout=1000"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1?timeout=1000"]')
          await link.click()
          await browser.waitForElementByCss('#loading')
          return browser.elementByCss('#loading').text()
        })

        expect(loadingRandomNumber).toBe(newLoadingNumber)

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        await browser.eval(fastForwardTo, 2 * 60 * 1000) // fast forward 2 minutes (total 4 minutes)

        // Toggle link - should trigger new prefetch after 3 min expiry
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate - should show fresh loading
        newLoadingNumber = await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
            await browser.waitForElementByCss('#loading')
            return browser.elementByCss('#loading').text()
          },
          { includes: 'random-number' }
        )

        expect(loadingRandomNumber).not.toBe(newLoadingNumber)
      })
    })

    if (!isNextDeploy) {
      describe('telemetry', () => {
        it('should send staleTimes feature usage event', async () => {
          const events = findAllTelemetryEvents(
            next.cliOutput,
            'NEXT_CLI_SESSION_STARTED'
          )
          expect(events).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                staticStaleTime: 180,
                dynamicStaleTime: null,
              }),
            ])
          )
        })
      })
    }
  })
})
