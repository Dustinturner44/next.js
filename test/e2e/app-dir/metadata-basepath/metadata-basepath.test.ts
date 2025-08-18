import { nextTestSetup } from 'e2e-utils'

describe('metadata-basepath', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should include basepath in favicon URL', async () => {
    const $ = await next.render$('/docs')
    const faviconLink = $('link[rel="icon"]')
    const href = faviconLink.attr('href')
    expect(href).toMatch(/\/docs\/favicon\.ico/)
  })

  it('should serve favicon with basepath', async () => {
    const res = await next.fetch('/docs/favicon.ico')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/x-icon')
  })

  it('should include basepath in apple-icon URL', async () => {
    const $ = await next.render$('/docs')
    const icon = $('link[rel="icon"]:not([href*="favicon.ico"])')
    const href = icon.attr('href')
    expect(href).toMatch(/\/docs\/icon.png/)
  })

  it('should serve metadata routes with basepath', async () => {
    const routes = ['/docs/icon.png', '/docs/favicon.ico']

    for (const route of routes) {
      const res = await next.fetch(route)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/image\//)
    }
  })
})
