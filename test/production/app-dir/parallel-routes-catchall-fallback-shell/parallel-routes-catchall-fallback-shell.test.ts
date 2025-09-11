import { nextTestSetup } from 'e2e-utils'

describe('parallel-routes-catchall-fallback-shell', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should not include catchall route in build output', async () => {
    expect(next.cliOutput).not.toContain('/[...catchAll]')
  })

  it('should work', async () => {
    const browser = await next.browser('/')
    await browser.elementByCss('[href="/foo"]').click()
    expect(await browser.elementById('slot').text()).toBe('slot catchall')
    expect(await browser.elementById('children').text()).toBe('foo')
  })
})
