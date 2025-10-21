import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'

describe('app dir - workers', () => {
  const { next, skipped } = nextTestSetup({
    files: __dirname,
    skipDeployment: true,
  })

  if (skipped) {
    return
  }

  it('should support web workers with dynamic imports', async () => {
    const browser = await next.browser('/classic')
    expect(await browser.elementByCss('#worker-state').text()).toBe('default')

    await browser.elementByCss('button').click()

    await retry(async () =>
      expect(await browser.elementByCss('#worker-state').text()).toBe(
        'worker.ts:worker-dep'
      )
    )
  })

  it('should support module web workers with dynamic imports', async () => {
    const browser = await next.browser('/module')
    expect(await browser.elementByCss('#worker-state').text()).toBe('default')

    await browser.elementByCss('button').click()

    await retry(async () =>
      expect(await browser.elementByCss('#worker-state').text()).toBe(
        'worker.ts:worker-dep'
      )
    )
  })

  it('should not bundle web workers with string specifiers', async () => {
    const browser = await next.browser('/string')
    expect(await browser.elementByCss('#worker-state').text()).toBe('default')

    await browser.elementByCss('button').click()

    await retry(async () =>
      expect(await browser.elementByCss('#worker-state').text()).toBe(
        'unbundled-worker'
      )
    )
  })

  it('should support shared workers with string specifiers', async () => {
    const browser = await next.browser('/shared-unbundled')
    expect(await browser.elementByCss('#shared-worker-state').text()).toBe(
      'default'
    )

    await browser.elementByCss('button').click()

    await retry(async () =>
      expect(await browser.elementByCss('#shared-worker-state').text()).toBe(
        'unbundled-shared-worker'
      )
    )
  })

  it('should support shared workers with dynamic imports', async () => {
    const browser = await next.browser('/shared-bundled')
    expect(
      await browser.elementByCss('#shared-worker-bundled-state').text()
    ).toBe('default')

    await browser.elementByCss('button').click()

    await retry(async () =>
      expect(
        await browser.elementByCss('#shared-worker-bundled-state').text()
      ).toBe('shared-worker.ts:worker-dep')
    )
  })
})
