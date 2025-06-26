import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'e2e-utils'

describe('navigation between pages and app dir', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(__dirname),
      dependencies: {
        typescript: 'latest',
        '@types/react': 'latest',
        '@types/node': 'latest',
      },
    })
  })
  afterAll(() => next.destroy())

  it('It should be able to navigate app -> pages', async () => {
    const browser = await next.browser('/app')
    expect(await browser.elementById('app-page').text()).toBe('App Page')
    await browser
      .elementById('link-to-pages')
      .click()
      .waitForElementByCss('#pages-page')
    expect(await browser.hasElementByCssSelector('#app-page')).toBeFalse()
    expect(await browser.elementById('pages-page').text()).toBe('Pages Page')
  })

  it('It should be able to navigate pages -> app', async () => {
    const browser = await next.browser('/pages')
    expect(await browser.elementById('pages-page').text()).toBe('Pages Page')
    await browser
      .elementById('link-to-app')
      .click()
      .waitForElementByCss('#app-page')
    expect(await browser.hasElementByCssSelector('#pages-page')).toBeFalse()
    expect(await browser.elementById('app-page').text()).toBe('App Page')
  })

  // TODO: re-enable after 404 transition bug is addressed
  if (!(global as any).isNextDeploy) {
    it('It should be able to navigate pages -> app and go back an forward', async () => {
      const browser = await next.browser('/pages')
      await browser
        .elementById('link-to-app')
        .click()
        .waitForElementByCss('#app-page')
      await browser.back().waitForElementByCss('#pages-page')
      expect(await browser.hasElementByCssSelector('#app-page')).toBeFalse()
      expect(await browser.elementById('pages-page').text()).toBe('Pages Page')
      await browser.forward().waitForElementByCss('#app-page')
      expect(await browser.hasElementByCssSelector('#pages-page')).toBeFalse()
      expect(await browser.elementById('app-page').text()).toBe('App Page')
    })

    it('It should be able to navigate app -> pages and go back and forward', async () => {
      const browser = await next.browser('/app')
      await browser
        .elementById('link-to-pages')
        .click()
        .waitForElementByCss('#pages-page')
      await browser.back().waitForElementByCss('#app-page')
      expect(await browser.hasElementByCssSelector('#pages-page')).toBeFalse()
      expect(await browser.elementById('app-page').text()).toBe('App Page')
      await browser.forward().waitForElementByCss('#pages-page')
      expect(await browser.hasElementByCssSelector('#app-page')).toBeFalse()
      expect(await browser.elementById('pages-page').text()).toBe('Pages Page')
    })
  }
})
