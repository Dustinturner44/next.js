import { nextTestSetup } from 'e2e-utils'

describe('robots.txt rewrite', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should rewrite robots.txt to redirected-robots', async () => {
    const browser = await next.browser('/robots.txt')
    expect(await browser.elementByCss('body').text()).toContain(
      'Redirected Robots'
    )
  })
})
