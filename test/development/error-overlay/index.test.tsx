import { nextTestSetup } from 'e2e-utils'
import { assertHasRedbox } from 'next-test-utils'

describe('DevErrorOverlay', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('can get error code from RSC error thrown by framework', async () => {
    await next.render('/known-rsc-error')
    const browser = await next.browser('/known-rsc-error')
    const errorCode = await browser.waitForElementByCss(
      '[data-nextjs-error-code]'
    )
    const code = await errorCode.getAttribute('data-nextjs-error-code')
    expect(code).toBe('E127')
  })

  it('can get error code from client side error thrown by framework', async () => {
    await next.render('/known-client-error')

    const browser = await next.browser('/known-client-error')

    await browser.elementByCss('button').click() // clicked "break on client"

    const errorCode = await browser.waitForElementByCss(
      '[data-nextjs-error-code]'
    )
    const code = await errorCode.getAttribute('data-nextjs-error-code')
    expect(code).toBe('E209')
  })

  it('loads fonts successfully', async () => {
    const woff2Requests: { url: string; status: number }[] = []
    const browser = await next.browser('/known-rsc-error', {
      beforePageLoad: (page) => {
        page.route('**/*.woff2', async (route) => {
          const response = await route.fetch()
          woff2Requests.push({
            url: route.request().url(),
            status: response.status(),
          })
          await route.continue()
        })
      },
    })

    await assertHasRedbox(browser)
    await browser.waitForIdleNetwork()

    // Verify woff2 files were requested and loaded successfully
    expect(woff2Requests.length).toBeGreaterThan(0)
    for (const request of woff2Requests) {
      expect(request.status).toBe(200)
    }
  })

  it('should load dev overlay styles successfully', async () => {
    const browser = await next.browser('/hydration-error')

    await assertHasRedbox(browser)
    const redbox = browser.locateRedbox()

    // check the data-nextjs-dialog-header="true" DOM element styles under redbox is applied
    const dialogHeader = redbox.locator('[data-nextjs-dialog-header="true"]')
    expect(await dialogHeader.isVisible()).toBe(true)
    // get computed styles
    const computedStyles = await dialogHeader.evaluate((element) => {
      return window.getComputedStyle(element)
    })
    const styles = {
      backgroundColor: computedStyles.backgroundColor,
      color: computedStyles.color,
    }

    expect(styles).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(117, 117, 117)',
    })
  })
})
