import { nextTestSetup } from 'e2e-utils'
import path from 'path'

describe('build-output-tree-view', () => {
  describe('with mixed static and dynamic pages and app router routes', () => {
    const { next } = nextTestSetup({
      files: path.join(__dirname, 'fixtures/mixed'),
      skipStart: true,
      env: {
        __NEXT_PRIVATE_DETERMINISTIC_BUILD_OUTPUT: '1',
      },
    })

    beforeAll(() => next.build())

    it('should show info about prerendered and dynamic routes in a tree view', async () => {
      expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
       "Route (app)             Revalidate  Expire
       ┌ ○ /_not-found
       ├ ƒ /api
       ├ ○ /api/force-static
       ├ ○ /app-static
       ├ ○ /cache-life-custom         ≈7m     ≈2h
       ├ ○ /cache-life-hours           1h      1d
       ├ ƒ /dynamic
       ├ ◐ /ppr/[slug]                 1w     30d
       ├   ├ /ppr/[slug]               1w     30d
       ├   ├ /ppr/days                 1d      1w
       ├   └ /ppr/weeks                1w     30d
       └ ○ /revalidate                15m      1y

       Route (pages)           Revalidate  Expire
       ┌ ƒ /api/hello
       ├ ● /gsp-revalidate             5m      1y
       ├ ƒ /gssp
       └ ○ /static

       ○  (Static)             prerendered as static content
       ●  (SSG)                prerendered as static HTML (uses generateStaticParams)
       ◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
       ƒ  (Dynamic)            server-rendered on demand"
      `)
    })
  })

  describe('with only a few static routes', () => {
    const { next } = nextTestSetup({
      files: path.join(__dirname, 'fixtures/minimal-static'),
      skipStart: true,
      env: {
        __NEXT_PRIVATE_DETERMINISTIC_BUILD_OUTPUT: '1',
      },
    })

    beforeAll(() => next.build())

    it('should show info about prerendered routes in a compact tree view', async () => {
      expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
       "Route (app)
       ┌ ○ /
       └ ○ /_not-found

       Route (pages)
       ─ ○ /static

       ○  (Static)  prerendered as static content"
      `)
    })
  })

  describe('with dynamic access and generateStaticParams', () => {
    describe.each([true, false])('cache components: %s', (cacheComponents) => {
      const { next } = nextTestSetup({
        files: path.join(__dirname, 'fixtures/dynamic-generate-static-params'),
        env: {
          __NEXT_PRIVATE_DETERMINISTIC_BUILD_OUTPUT: '1',
        },
        // We don't skip start in this test because we want to actually hit the
        // dynamic pages, and starting again would cause the current API to
        // re-build the app again.
        nextConfig: {
          experimental: {
            cacheComponents,
          },
        },
      })

      it('should mark routes with connection() as dynamic, not SSG', async () => {
        if (cacheComponents) {
          // When cache components are enabled, routes with connection() should be
          // marked as partial prerendered.
          expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
           "Route (app)
           ┌ ○ /_not-found
           └ ◐ /dynamic/[slug]
               ├ /dynamic/[slug]
               ├ /dynamic/slug-01
               ├ /dynamic/slug-02
               └ /dynamic/slug-03


           ○  (Static)             prerendered as static content
           ◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content"
          `)
        } else {
          // Routes with generateStaticParams that use connection() should be marked as dynamic
          // because connection() makes the page dynamic. This is a regression test for a bug
          // where pages with generateStaticParams were incorrectly marked as SSG even when
          // the individual routes used dynamic APIs.
          expect(getTreeView(next.cliOutput)).toMatchInlineSnapshot(`
           "Route (app)
           ┌ ○ /_not-found
           └ ƒ /dynamic/[slug]
               ├ /dynamic/slug-01
               ├ /dynamic/slug-02
               └ /dynamic/slug-03


           ○  (Static)   prerendered as static content
           ƒ  (Dynamic)  server-rendered on demand"
          `)
        }
      })

      it('should render the dynamic pages correctly', async () => {
        // Test one of the generated routes. We expect it to render and not
        // error.
        const $ = await next.render$('/dynamic/slug-01')
        expect($('#page').text()).toBe('Page slug-01')
      })
    })
  })
})

function getTreeView(cliOutput: string): string {
  let foundStart = false
  let cliHeader = 0
  const lines: string[] = []

  for (const line of cliOutput.split('\n')) {
    // Once we've seen the CLI header twice, we can stop reading the output,
    // as we've already collected the first command (the `next build` command)
    // and we can ignore the rest of the output.
    if (line.includes('▲ Next.js')) cliHeader++
    if (cliHeader === 2) break

    foundStart ||= line.startsWith('Route ')

    if (foundStart) {
      lines.push(line)
    }
  }

  return lines.join('\n').trim()
}
