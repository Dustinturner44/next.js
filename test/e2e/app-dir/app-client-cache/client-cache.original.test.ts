import { nextTestSetup } from 'e2e-utils'
import { createRouterAct } from 'router-act'
import { browserConfigWithFixedTime, fastForwardTo } from './test-utils'
import path from 'path'

// This preserves existing tests for the 30s/5min heuristic (previous router defaults)
describe('app dir client cache semantics (30s/5min)', () => {
  const { next, isNextDev } = nextTestSetup({
    files: path.join(__dirname, 'fixtures', 'regular'),
    nextConfig: {
      experimental: { staleTimes: { dynamic: 30, static: 180 } },
    },
  })

  if (isNextDev) {
    // dev doesn't support prefetch={true}, so this just performs a basic test to make sure data is reused for 30s
    it('should renew the 30s cache once the data is revalidated', async () => {
      let browser = await next.browser('/', browserConfigWithFixedTime)

      // navigate to prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()
      await browser.waitForElementByCss('#random-number')

      let initialNumber = await browser.elementById('random-number').text()

      // Navigate back to the index, and then back to the prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/"]').click()
      await browser.elementByCss('[href="/"]').click()
      await browser.eval(fastForwardTo, 5 * 1000)
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()
      await browser.waitForElementByCss('#random-number')

      let newNumber = await browser.elementById('random-number').text()

      // the number should be the same, as we navigated within 30s.
      expect(newNumber).toBe(initialNumber)

      // Fast forward to expire the cache
      await browser.eval(fastForwardTo, 30 * 1000)

      // Navigate back to the index, and then back to the prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/"]').click()
      await browser.elementByCss('[href="/"]').click()
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()
      await browser.waitForElementByCss('#random-number')

      newNumber = await browser.elementById('random-number').text()

      // ~35s have passed, so the cache should be expired and the number should be different
      expect(newNumber).not.toBe(initialNumber)

      // once the number is updated, we should have a renewed 30s cache for this entry
      // store this new number so we can check that it stays the same
      initialNumber = newNumber

      await browser.eval(fastForwardTo, 5 * 1000)

      // Navigate back to the index, and then back to the prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/"]').click()
      await browser.elementByCss('[href="/"]').click()
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()
      await browser.waitForElementByCss('#random-number')

      newNumber = await browser.elementById('random-number').text()

      // the number should be the same, as we navigated within 30s (part 2).
      expect(newNumber).toBe(initialNumber)
    })
  } else {
    describe('prefetch={true}', () => {
      it('should prefetch the full page', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Reveal the link to trigger prefetch and wait for it to complete
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

        // Navigate to /0 - should not make additional requests
        await act(async () => {
          await link.click()
          await browser.waitForElementByCss('#random-number')
        }, 'no-requests')
      })

      it('should re-use the cache for the full page, only for 5 mins', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link, assert on the prefetch content
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

        // Navigate to the page, assert no requests are made
        const randomNumber = await act(async () => {
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        // Toggle and navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Toggle the link to the other page again, navigate, assert no requests (because it's cached)
        const number = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/0?timeout=0"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/0?timeout=0"]')
          await link.click()
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(number).toBe(randomNumber)

        await browser.eval(fastForwardTo, 5 * 60 * 1000)

        // Navigate back home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Toggle the link to the other page again, assert on prefetch content
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

        // Navigate to the page and verify the content is fresh (different from cached)
        const newNumber = await act(async () => {
          await linkAfterExpiry.click()
          await browser.waitForElementByCss('#random-number')
          return await browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(newNumber).not.toBe(randomNumber)
      })

      it('should prefetch again after 5 mins if the link is visible again', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link, assert on the prefetch content
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

        // Navigate to the page, capture the random number
        const randomNumber = await act(async () => {
          await link.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        // Fast forward 5 minutes
        await browser.eval(fastForwardTo, 5 * 60 * 1000)

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Toggle the link again - should trigger a new prefetch with fresh data
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

        // Navigate to the page - should use the fresh prefetch
        const number = await act(async () => {
          await linkAfterExpiry.click()
          await browser.waitForElementByCss('#random-number')
          return browser.elementByCss('#random-number').text()
        }, 'no-requests')

        expect(number).not.toBe(randomNumber)
      })
    })
    describe('prefetch={false}', () => {
      it('should not prefetch the page at all', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link - should NOT trigger a prefetch
        const link = await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/2"]'
          )
          await reveal.click()
          return browser.elementByCss('[href="/2"]')
        }, 'no-requests')

        // Navigate to the page - should trigger a full page request (not a partial prefetch)
        await act(
          async () => {
            await link.click()
          },
          { includes: 'random-number' }
        )
      })

      it('should re-use the cache only for 30 seconds', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link - should NOT trigger a prefetch
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/2"]'
          )
          await reveal.click()
        }, 'no-requests')

        // Navigate to the page - should trigger a full page request
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/2"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const randomNumber = await browser.elementByCss('#random-number').text()

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Navigate back - should use cache (within 30s with dynamic: 30)
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/2"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/2"]')
          await link.click()
        })

        const number = await browser.elementByCss('#random-number').text()

        expect(number).toBe(randomNumber)

        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back after 30s - should fetch fresh data
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/2"]'
            )
            await reveal.click()
            const link = await browser.elementByCss('[href="/2"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const newNumber = await browser.elementByCss('#random-number').text()

        expect(newNumber).not.toBe(randomNumber)
      })
    })
    describe('prefetch={undefined} - default', () => {
      it('should prefetch partially a dynamic page', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link - should trigger a partial prefetch (loading boundary)
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate to the page - should trigger a full page request for the dynamic content
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/1"]')
            await link.click()
          },
          { includes: 'random-number' }
        )
      })

      it('should re-use the full cache for only 30 seconds', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link - should trigger a partial prefetch (loading boundary)
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate to the page - should trigger a full page request for the dynamic content
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/1"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const randomNumber = await browser.elementById('random-number').text()

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Navigate back - should use cache (within 30s with dynamic: 30)
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
        }, 'no-requests')

        const number = await browser.elementById('random-number').text()

        expect(number).toBe(randomNumber)

        await browser.eval(fastForwardTo, 5 * 1000)

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back - still cached (within 30s total)
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
          await browser.waitForElementByCss('#random-number')
        }, 'no-requests')

        const newNumber = await browser.elementById('random-number').text()

        expect(newNumber).toBe(randomNumber)

        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate home - cached
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back after 30s - should fetch fresh data
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1"]'
            )
            await reveal.click()
            const link = await browser.elementByCss('[href="/1"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const newNumber2 = await browser.elementById('random-number').text()

        expect(newNumber2).not.toBe(newNumber)
      })

      it('should renew the 30s cache once the data is revalidated', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle and navigate to prefetch-auto page
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        await act(
          async () => {
            const link = await browser.elementByCss('[href="/1"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        let initialNumber = await browser.elementById('random-number').text()

        // Navigate back to the index, and then back to the prefetch-auto page
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        await browser.eval(fastForwardTo, 5 * 1000)

        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
        }, 'no-requests')

        let newNumber = await browser.elementById('random-number').text()

        // the number should be the same, as we navigated within 30s.
        expect(newNumber).toBe(initialNumber)

        // Fast forward to expire the cache
        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate back to the index, and then back to the prefetch-auto page
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
        }, [{ includes: 'random-number' }])

        newNumber = await browser.elementById('random-number').text()

        // ~35s have passed, so the cache should be expired and the number should be different
        expect(newNumber).not.toBe(initialNumber)

        // once the number is updated, we should have a renewed 30s cache for this entry
        // store this new number so we can check that it stays the same
        initialNumber = newNumber

        await browser.eval(fastForwardTo, 5 * 1000)

        // Navigate back to the index, and then back to the prefetch-auto page
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
        }, 'no-requests')

        newNumber = await browser.elementById('random-number').text()

        // the number should be the same, as we navigated within 30s (part 2).
        expect(newNumber).toBe(initialNumber)
      })

      it('should refetch below the fold after 30 seconds', async () => {
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

        // Navigate - should fetch full page
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
          },
          { includes: 'random-number' }
        )

        const randomNumber = await browser.elementById('random-number').text()

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate back after 30s - should fetch fresh data
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1?timeout=1000"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1?timeout=1000"]')
          await link.click()
        }, [{ includes: 'random-number' }])

        const newNumber = await browser.elementById('random-number').text()

        expect(newNumber).not.toBe(randomNumber)
      })

      it('should refetch the full page after 5 mins', async () => {
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

        // Navigate - should fetch full page and show loading
        const randomLoadingNumber = await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
            return browser.elementByCss('#loading').text()
          },
          { includes: 'random-number' }
        )

        const randomNumber = await browser.elementByCss('#random-number').text()

        await browser.eval(fastForwardTo, 5 * 60 * 1000)

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Toggle link - should trigger new prefetch with fresh loading
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate - should show fresh loading and number
        const newLoadingNumber = await act(
          async () => {
            const link = await browser.elementByCss('[href="/1?timeout=1000"]')
            await link.click()
            return browser.elementByCss('#loading').text()
          },
          { includes: 'random-number' }
        )

        const newNumber = await browser.elementByCss('#random-number').text()

        expect(newLoadingNumber).not.toBe(randomLoadingNumber)
        expect(newNumber).not.toBe(randomNumber)
      })

      it('should respect a loading boundary that returns `null`', async () => {
        let act: ReturnType<typeof createRouterAct>
        const browser = await next.browser('/', {
          beforePageLoad(page) {
            browserConfigWithFixedTime.beforePageLoad(page)
            act = createRouterAct(page)
          },
        })

        // Toggle the link - should trigger a partial prefetch
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/null-loading"]'
          )
          await reveal.click()
        })

        // Navigate to the page - should trigger a full page request
        await act(
          async () => {
            const link = await browser.elementByCss('[href="/null-loading"]')
            await link.click()

            // the page content should disappear immediately
            expect(
              await browser.hasElementByCssSelector(
                '[data-link-accordion="/null-loading"]'
              )
            ).toBe(false)

            // the root layout should still be visible
            expect(await browser.hasElementByCssSelector('#root-layout')).toBe(
              true
            )
          },
          { includes: 'random-number' }
        )

        // the dynamic content should eventually appear
        expect(await browser.hasElementByCssSelector('#random-number')).toBe(
          true
        )
      })
    })

    it('should seed the prefetch cache with the fetched page data', async () => {
      let act: ReturnType<typeof createRouterAct>
      const browser = await next.browser('/1', {
        beforePageLoad(page) {
          browserConfigWithFixedTime.beforePageLoad(page)
          act = createRouterAct(page)
        },
      })

      await browser.waitForElementByCss('#random-number')
      const initialNumber = await browser.elementById('random-number').text()

      // Move forward a few seconds, navigate off the page and then back to it
      await browser.eval(fastForwardTo, 5 * 1000)

      await act(async () => {
        const reveal = await browser.elementByCss('[data-link-accordion="/"]')
        await reveal.click()
        const homeLink = await browser.elementByCss('[href="/"]')
        await homeLink.click()
      })

      // Toggle link - triggers prefetch which should use seeded data
      await act(
        async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
        },
        { includes: 'loading' }
      )

      await act(async () => {
        const link = await browser.elementByCss('[href="/1"]')
        await link.click()
        await browser.waitForElementByCss('#random-number')
      }, 'no-requests')

      const newNumber = await browser.elementById('random-number').text()

      // The number should be the same as we've seeded it in the prefetch cache when we loaded the full page
      expect(newNumber).toBe(initialNumber)
    })

    it('should renew the initial seeded data after expiration time', async () => {
      let act: ReturnType<typeof createRouterAct>
      const browser = await next.browser('/without-loading/1', {
        beforePageLoad(page) {
          browserConfigWithFixedTime.beforePageLoad(page)
          act = createRouterAct(page)
        },
      })

      const initialNumber = await browser.elementById('random-number').text()

      // Expire the cache
      await browser.eval(fastForwardTo, 30 * 1000)
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
            '[data-link-accordion="/without-loading/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/without-loading/1"]')
          await link.click()
        },
        { includes: 'random-number' }
      )

      let newNumber = await browser.elementById('random-number').text()

      // The number should be different, as the seeded data has expired after 30s
      expect(newNumber).not.toBe(initialNumber)
    })
  }
})
