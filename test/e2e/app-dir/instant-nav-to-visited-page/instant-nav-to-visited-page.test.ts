import { nextTestSetup } from 'e2e-utils'

describe('instant navigation to previously visited pages', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should handle navigation when network is disabled', async () => {
    // Set up route interception at the beginning to control when to block requests
    let shouldBlockRequests = false
    const browser = await next.browser('/', {
      beforePageLoad(page) {
        // Set up route interception to block requests when shouldBlockRequests is true
        page.route('**', (route) => {
          if (shouldBlockRequests) {
            route.abort('internetdisconnected')
          } else {
            route.continue()
          }
        })
      },
    })

    await browser.elementByCss('a[href="/lesson-1"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-1'
    )

    await browser.elementByCss('a[href="/lesson-2"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-2'
    )

    await browser.elementByCss('a[href="/lesson-3"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-3'
    )

    await browser.elementByCss('a[href="/lesson-4"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-4'
    )

    await browser.waitForIdleNetwork()

    // Enable offline mode
    shouldBlockRequests = true

    // I should still be able to navigate to previously visited pages
    await browser.elementByCss('a[href="/lesson-1"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-1'
    )
    // TODO: assert body is in loading state

    await browser.elementByCss('a[href="/lesson-2"]').click()

    // TODO: The test would fail at this point because the second click
    // after offline would simply be blocking. The same would happen for
    // slow connections too, i.e., the subsequent clicks after network
    // throttling would significantly delay navigation to already visited
    // pages.
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-2'
    )
    // TODO: assert body is in loading state

    await browser.elementByCss('a[href="/lesson-3"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-3'
    )
    // TODO: assert body is in loading state

    await browser.elementByCss('a[href="/lesson-4"]').click()
    expect(await browser.elementByCss('h1').text()).toContain(
      'Lesson Page lesson-4'
    )
    // TODO: assert body is in loading state
  })
})
