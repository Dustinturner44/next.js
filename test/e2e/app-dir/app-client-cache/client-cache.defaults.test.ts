import { nextTestSetup } from 'e2e-utils'
import { createRouterAct } from 'router-act'
import { browserConfigWithFixedTime, fastForwardTo } from './test-utils'
import path from 'path'

describe('app dir client cache semantics (default semantics)', () => {
  const { next, isNextDev } = nextTestSetup({
    files: path.join(__dirname, 'fixtures', 'regular'),
  })

  if (isNextDev) {
    // dev doesn't support prefetch={true}, so this just performs a basic test to make sure data is reused for 30s
    it('should return fresh data every navigation', async () => {
      let browser = await next.browser('/', browserConfigWithFixedTime)

      // navigate to prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()

      let initialNumber = await browser.elementById('random-number').text()

      // Navigate back to the index, and then back to the prefetch-auto page
      await browser.elementByCss('[data-link-accordion="/"]').click()
      await browser.elementByCss('[href="/"]').click()
      await browser.eval(fastForwardTo, 5 * 1000)
      await browser.elementByCss('[data-link-accordion="/1"]').click()
      await browser.elementByCss('[href="/1"]').click()

      let newNumber = await browser.elementById('random-number').text()

      expect(newNumber).not.toBe(initialNumber)
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

        // Navigate back home - it's cached, from the previous navigation
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
          await browser.waitForElementByCss('#home-page')
        }, 'no-requests')

        // Fast forward 5 minutes
        await browser.eval(fastForwardTo, 5 * 60 * 1000)

        // Toggle the link to the other page again. we should have a new prefetch request
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
      it('should not re-use the page segment cache', async () => {
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

        // Navigate back - should fetch fresh data, not use cache
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

        const newRandomNumber = await browser
          .elementByCss('#random-number')
          .text()

        expect(newRandomNumber).not.toBe(randomNumber)

        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate home - already cached from the previous home prefetch, so no requests should be made
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        }, 'no-requests')

        // Navigate back again - should still fetch fresh data
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

        const finalRandomNumber = await browser
          .elementByCss('#random-number')
          .text()

        expect(finalRandomNumber).not.toBe(newRandomNumber)
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
      it('should not re-use the page segment cache', async () => {
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

        const randomNumber = await browser.elementByCss('#random-number').text()

        // Navigate home
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
        })

        // Navigate back - should fetch fresh data (no cache reuse)
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
          // should see a loading state
          await browser.waitForElementByCss('#loading')
        }, [{ includes: 'random-number' }])

        let newRandomNumber = await browser
          .elementByCss('#random-number')
          .text()

        expect(newRandomNumber).not.toBe(randomNumber)

        await browser.eval(fastForwardTo, 5 * 1000)

        // Navigate home - already cached from the previous home prefetch, so no requests should be made
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
          await browser.waitForElementByCss('#home-page')
        }, 'no-requests')

        // Navigate back again - should still fetch fresh data
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
          // should see a loading state
          await browser.waitForElementByCss('#loading')
        }, [{ includes: 'random-number' }])

        newRandomNumber = await browser.elementByCss('#random-number').text()
        expect(newRandomNumber).not.toBe(randomNumber)

        await browser.eval(fastForwardTo, 30 * 1000)

        // Navigate home - already cached from the previous home prefetch, so no requests should be made
        await act(async () => {
          const reveal = await browser.elementByCss('[data-link-accordion="/"]')
          await reveal.click()
          const homeLink = await browser.elementByCss('[href="/"]')
          await homeLink.click()
          await browser.waitForElementByCss('#home-page')
        }, 'no-requests')

        // Navigate back once more - should still fetch fresh data
        await act(async () => {
          const reveal = await browser.elementByCss(
            '[data-link-accordion="/1"]'
          )
          await reveal.click()
          const link = await browser.elementByCss('[href="/1"]')
          await link.click()
          // should see a loading state
          await browser.waitForElementByCss('#loading')
        }, [{ includes: 'random-number' }])

        const finalRandomNumber = await browser
          .elementByCss('#random-number')
          .text()
        expect(finalRandomNumber).not.toBe(newRandomNumber)
      })

      it('should refetch the full page after 5 mins', async () => {
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
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate to the page - should trigger a full page request and show loading
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

        // Toggle the link again - should trigger a new partial prefetch with fresh loading
        await act(
          async () => {
            const reveal = await browser.elementByCss(
              '[data-link-accordion="/1?timeout=1000"]'
            )
            await reveal.click()
          },
          { includes: 'loading' }
        )

        // Navigate to the page - should show fresh loading and number
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

        // Toggle the link - should trigger a partial prefetch (with null loading, just Page Data!)
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
        //  await browser.waitForElementByCss('#random-number')
        expect(await browser.hasElementByCssSelector('#random-number')).toBe(
          true
        )
      })
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
