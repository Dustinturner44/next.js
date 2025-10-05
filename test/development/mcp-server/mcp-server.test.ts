import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { retry } from 'next-test-utils'
import stripAnsi from 'strip-ansi'
import { chromium, firefox, webkit, type Browser } from 'playwright'

interface McpResponse {
  jsonrpc: string
  id: string | number
  result?: {
    content?: Array<{ type: string; text: string }>
    tools?: Array<{ name: string }>
  }
  error?: {
    code: number
    message: string
  }
}

class McpClient {
  private process: ChildProcess
  private responses: Map<string | number, (response: McpResponse) => void> =
    new Map()
  private buffer = ''

  constructor(mcpServerPath: string) {
    this.process = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout!.on('data', (data) => {
      this.buffer += data.toString()
      const lines = this.buffer.split('\n')
      this.buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response: McpResponse = JSON.parse(line)
            const resolver = this.responses.get(response.id)
            if (resolver) {
              resolver(response)
              this.responses.delete(response.id)
            }
          } catch (e) {}
        }
      }
    })

    this.process.stderr!.on('data', () => {})
  }

  async sendRequest(
    method: string,
    params: Record<string, unknown> = {},
    id: string | number = Date.now()
  ): Promise<McpResponse> {
    return new Promise((resolve, reject) => {
      this.responses.set(id, resolve)

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }

      this.process.stdin!.write(JSON.stringify(request) + '\n')

      setTimeout(() => {
        if (this.responses.has(id)) {
          this.responses.delete(id)
          reject(new Error('MCP request timeout'))
        }
      }, 5000)
    })
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<McpResponse> {
    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: args,
    })
  }

  async close() {
    this.process.kill()
    await new Promise((resolve) => {
      this.process.on('exit', resolve)
      setTimeout(resolve, 1000)
    })
  }
}

describe('mcp-server', () => {
  describe('basic functionality', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(__dirname, '../devtools-api/fixtures/default-template')
      ),
    })

    let mcpClient: McpClient

    beforeAll(() => {
      const mcpServerPath = path.join(
        __dirname,
        '../../../packages/next-devtools-mcp-server/dist/index.js'
      )
      mcpClient = new McpClient(mcpServerPath)
    })

    afterAll(async () => {
      if (mcpClient) {
        await mcpClient.close()
      }
    })

    it('should support tools/list method', async () => {
      const result = await mcpClient.sendRequest('tools/list', {}, 'list-tools')

      expect(result.jsonrpc).toBe('2.0')
      expect(result.id).toBe('list-tools')
      expect(result.result?.tools).toBeInstanceOf(Array)

      const toolNames = result.result!.tools!.map((t) => t.name)
      expect(toolNames).toContain('get_project_path')
      expect(toolNames).toContain('get_errors')
      expect(toolNames).toContain('get_page_metadata')
      expect(toolNames).toContain('get_logs')
      expect(toolNames).toContain('get_server_action_by_id')
    })

    it('should call get_project_path successfully', async () => {
      const result = await mcpClient.callTool('get_project_path', {
        baseUrl: next.url,
      })

      expect(result.jsonrpc).toBe('2.0')

      const content = result.result?.content
      expect(content).toBeInstanceOf(Array)
      expect(content?.[0]?.type).toBe('text')

      const projectPath = content?.[0]?.text
      expect(path.isAbsolute(projectPath)).toBe(true)
      expect(projectPath).toBe(next.testDir)
    })
  })

  describe('get_errors tool', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(__dirname, '../devtools-api/fixtures/default-template')
      ),
    })

    let mcpClient: McpClient

    beforeAll(() => {
      const mcpServerPath = path.join(
        __dirname,
        '../../../packages/next-devtools-mcp-server/dist/index.js'
      )
      mcpClient = new McpClient(mcpServerPath)
    })

    afterAll(async () => {
      if (mcpClient) {
        await mcpClient.close()
      }
    })

    async function callGetErrors(): Promise<string> {
      const result = await mcpClient.callTool('get_errors', {
        baseUrl: next.url,
      })
      return result.result?.content?.[0]?.text || ''
    }

    it('should handle no browser sessions gracefully', async () => {
      const errors = await callGetErrors()
      expect(stripAnsi(errors)).toMatchInlineSnapshot(
        `"No browser sessions connected. Please open your application in a browser to retrieve error state."`
      )
    })

    it('should return no errors for clean page', async () => {
      await next.browser('/')
      const errors = await callGetErrors()
      expect(stripAnsi(errors)).toMatchInlineSnapshot(
        `"No errors detected in 1 browser session(s)."`
      )
    })

    it('should capture runtime errors with source-mapped stack frames', async () => {
      const browser = await next.browser('/')
      await browser.elementByCss('a[href="/runtime-error"]').click()

      let errors: string = ''
      await retry(async () => {
        errors = await callGetErrors()
        expect(errors).toContain('Runtime Errors')
        expect(errors).toContain('Found errors in 1 browser session')
      })

      const strippedErrors = stripAnsi(errors).replace(
        /localhost:\d+/g,
        'localhost:PORT'
      )

      expect(strippedErrors).toContain('Session: /runtime-error')

      expect(strippedErrors).toMatchInlineSnapshot(`
        "# Found errors in 1 browser session(s)

        ## Session: /runtime-error

        **1 error(s) found**

        ### Runtime Errors

        #### Error 1 (Type: runtime)

        **Error**: Test runtime error

        \`\`\`
          at RuntimeErrorPage (app/runtime-error/page.tsx:2:9)
        \`\`\`

        ---"
      `)
    })

    it('should capture build errors when directly visiting error page', async () => {
      await next.browser('/build-error')

      let errors: string = ''
      await retry(async () => {
        errors = await callGetErrors()
        expect(errors).toContain('Build Error')
        expect(errors).toContain('Found errors in 1 browser session')
      })

      let strippedErrors = stripAnsi(errors).replace(
        /localhost:\d+/g,
        'localhost:PORT'
      )

      expect(strippedErrors).toContain('Session: /build-error')

      const isTurbopack = process.env.IS_TURBOPACK_TEST === '1'
      const isRspack = !!process.env.NEXT_RSPACK

      if (isTurbopack) {
        strippedErrors = strippedErrors.replace(/\.\/test\/tmp\/[^/]+\//g, './')
      }

      if (isTurbopack) {
        expect(strippedErrors).toMatchInlineSnapshot(`
          "# Found errors in 1 browser session(s)

          ## Session: /build-error

          **2 error(s) found**

          ### Build Error

          \`\`\`
          ./app/build-error/page.tsx:4:1
          Parsing ecmascript source code failed
            2 |   // Syntax error - missing closing brace
            3 |   return <div>Page
          > 4 | }
              | ^
            5 |

          Unexpected token. Did you mean \`{'}'}\` or \`&rbrace;\`?
          \`\`\`

          ### Runtime Errors

          #### Error 1 (Type: runtime)

          **Error**: ./app/build-error/page.tsx:4:1
          Parsing ecmascript source code failed
            2 |   // Syntax error - missing closing brace
            3 |   return <div>Page
          > 4 | }
              | ^
            5 |

          Unexpected token. Did you mean \`{'}'}\` or \`&rbrace;\`?



          \`\`\`
            at <unknown> (Error: ./app/build-error/page.tsx:4:1)
            at <unknown> (Error: (./app/build-error/page.tsx:4:1)
          \`\`\`

          ---"
        `)
      } else if (isRspack) {
        expect(strippedErrors).toMatchInlineSnapshot(`
          "# Found errors in 1 browser session(s)

          ## Session: /build-error

          **1 error(s) found**

          ### Build Error

          \`\`\`
          ./app/build-error/page.tsx
            × Module build failed:
            ╰─▶   × Error:   x Unexpected token. Did you mean \`{'}'}\` or \`&rbrace;\`?
                  │    ,-[4:1]
                  │  1 | export default function BuildErrorPage() {
                  │  2 |   // Syntax error - missing closing brace
                  │  3 |   return <div>Page
                  │  4 | }
                  │    : ^
                  │    \`----
                  │   x Expected '</', got '<eof>'
                  │    ,-[4:1]
                  │  1 | export default function BuildErrorPage() {
                  │  2 |   // Syntax error - missing closing brace
                  │  3 |   return <div>Page
                  │  4 | }
                  │    \`----
                  │
                  │
                  │ Caused by:
                  │     Syntax Error
          \`\`\`

          ---"
        `)
      } else {
        expect(strippedErrors).toMatchInlineSnapshot(`
         "# Found errors in 1 browser session(s)

         ## Session: /build-error

         **1 error(s) found**

         ### Build Error

         \`\`\`
         ./app/build-error/page.tsx
         Error:   x Unexpected token. Did you mean \`{'}'}\` or \`&rbrace;\`?
            ,-[4:1]
          1 | export default function BuildErrorPage() {
          2 |   // Syntax error - missing closing brace
          3 |   return <div>Page
          4 | }
            : ^
            \`----
           x Expected '</', got '<eof>'
            ,-[4:3]
          2 |   // Syntax error - missing closing brace
          3 |   return <div>Page
          4 | }
            \`----

         Caused by:
             Syntax Error
         \`\`\`

         ---"
        `)
      }
    })

    it('should capture errors from multiple browser sessions', async () => {
      await next.stop()
      await next.start()

      const [s1, s2] = await Promise.all([
        launchStandaloneSession(next.url, '/runtime-error'),
        launchStandaloneSession(next.url, '/runtime-error-2'),
      ])

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        let errors: string = ''
        await retry(async () => {
          errors = await callGetErrors()
          expect(errors).toMatch(/Found errors in \d+ browser session/)
          expect(errors).toContain('/runtime-error')
          expect(errors).toContain('/runtime-error-2')
        })

        const strippedErrors = stripAnsi(errors).replace(
          /localhost:\d+/g,
          'localhost:PORT'
        )

        const session1Match = strippedErrors.match(
          /## Session: \/runtime-error\n[\s\S]*?(?=---)/
        )
        const session2Match = strippedErrors.match(
          /## Session: \/runtime-error-2\n[\s\S]*?(?=---)/
        )

        expect(session1Match).toBeTruthy()
        expect(session2Match).toBeTruthy()

        expect(session1Match?.[0]).toMatchInlineSnapshot(`
          "## Session: /runtime-error

          **1 error(s) found**

          ### Runtime Errors

          #### Error 1 (Type: runtime)

          **Error**: Test runtime error

          \`\`\`
            at RuntimeErrorPage (app/runtime-error/page.tsx:2:9)
          \`\`\`

          "
        `)

        expect(session2Match?.[0]).toMatchInlineSnapshot(`
          "## Session: /runtime-error-2

          **1 error(s) found**

          ### Runtime Errors

          #### Error 1 (Type: runtime)

          **Error**: Test runtime error 2

          \`\`\`
            at RuntimeErrorPage (app/runtime-error-2/page.tsx:2:9)
          \`\`\`

          "
        `)
      } finally {
        await s1.close()
        await s2.close()
      }
    })
  })

  describe('get_page_metadata tool - app router', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(
          __dirname,
          '../devtools-api/fixtures/parallel-routes-template'
        )
      ),
    })

    let mcpClient: McpClient

    beforeAll(() => {
      const mcpServerPath = path.join(
        __dirname,
        '../../../packages/next-devtools-mcp-server/dist/index.js'
      )
      mcpClient = new McpClient(mcpServerPath)
    })

    afterAll(async () => {
      if (mcpClient) {
        await mcpClient.close()
      }
    })

    async function callGetPageMetadata(): Promise<string> {
      const result = await mcpClient.callTool('get_page_metadata', {
        baseUrl: next.url,
      })
      return result.result?.content?.[0]?.text || ''
    }

    it('should return metadata for basic page', async () => {
      await next.browser('/')
      const metadata = await callGetPageMetadata()

      expect(stripAnsi(metadata)).toMatchInlineSnapshot(`
        "# Page metadata from 1 browser session(s)

        ## Session: /

        **Router type:** app

        ### Files powering this page:

        - app/layout.tsx
        - global-error.js (boundary, builtin)
        - app/error.tsx (boundary)
        - app/loading.tsx (boundary)
        - app/not-found.tsx (boundary)
        - app/page.tsx

        ---"
      `)
    })

    it('should return metadata for parallel routes', async () => {
      await next.browser('/parallel')

      let metadata: string = ''
      await retry(async () => {
        metadata = await callGetPageMetadata()
        expect(metadata).toContain('Page metadata from 1 browser session')
        expect(metadata).toContain('Files powering this page')
        expect(metadata).toContain('app/parallel/@sidebar/page.tsx')
        expect(metadata).toContain('app/parallel/@content/page.tsx')
        expect(metadata).toContain('app/parallel/page.tsx')
      })

      expect(stripAnsi(metadata)).toMatchInlineSnapshot(`
       "# Page metadata from 1 browser session(s)

       ## Session: /parallel

       **Router type:** app

       ### Files powering this page:

       - app/layout.tsx
       - app/parallel/layout.tsx
       - global-error.js (boundary, builtin)
       - app/error.tsx (boundary)
       - app/parallel/error.tsx (boundary)
       - app/parallel/@content/error.tsx (boundary)
       - app/loading.tsx (boundary)
       - app/parallel/loading.tsx (boundary)
       - app/parallel/@sidebar/loading.tsx (boundary)
       - app/not-found.tsx (boundary)
       - app/parallel/page.tsx
       - app/parallel/@content/page.tsx
       - app/parallel/@sidebar/page.tsx

       ---"
      `)
    })

    it('should handle multiple browser sessions', async () => {
      const session1 = await launchStandaloneSession(next.url, '/')
      const session2 = await launchStandaloneSession(next.url, '/parallel')

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        let metadata: string = ''
        await retry(async () => {
          metadata = await callGetPageMetadata()
          expect(metadata).toMatch(/Page metadata from \d+ browser session/)
          expect(metadata).toContain('Session: /')
          expect(metadata).toContain('Session: /parallel')
        })

        const strippedMetadata = stripAnsi(metadata)

        const session1Match = strippedMetadata.match(
          /## Session: \/\n[\s\S]*?(?=(\n## Session:|\n?$))/
        )
        const session2Match = strippedMetadata.match(
          /## Session: \/parallel\n[\s\S]*?(?=(\n## Session:|\n?$))/
        )

        if (session1Match) session1Match[0] = session1Match[0].trimEnd()
        if (session2Match) session2Match[0] = session2Match[0].trimEnd()

        expect(session1Match).toBeTruthy()
        expect(session2Match).toBeTruthy()

        expect(session1Match?.[0]).toMatchInlineSnapshot(`
          "## Session: /

          **Router type:** app

          ### Files powering this page:

          - app/layout.tsx
          - global-error.js (boundary, builtin)
          - app/error.tsx (boundary)
          - app/loading.tsx (boundary)
          - app/not-found.tsx (boundary)
          - app/page.tsx

          ---"
        `)

        expect(session2Match?.[0]).toMatchInlineSnapshot(`
         "## Session: /parallel

         **Router type:** app

         ### Files powering this page:

         - app/layout.tsx
         - app/parallel/layout.tsx
         - global-error.js (boundary, builtin)
         - app/error.tsx (boundary)
         - app/parallel/error.tsx (boundary)
         - app/parallel/@content/error.tsx (boundary)
         - app/loading.tsx (boundary)
         - app/parallel/loading.tsx (boundary)
         - app/parallel/@sidebar/loading.tsx (boundary)
         - app/not-found.tsx (boundary)
         - app/parallel/page.tsx
         - app/parallel/@content/page.tsx
         - app/parallel/@sidebar/page.tsx

         ---"
        `)
      } finally {
        await session1.close()
        await session2.close()
      }
    })
  })

  describe('get_page_metadata tool - pages router', () => {
    const { next } = nextTestSetup({
      files: new FileRef(
        path.join(__dirname, '../devtools-api/fixtures/pages-router-template')
      ),
    })

    let mcpClient: McpClient

    beforeAll(() => {
      const mcpServerPath = path.join(
        __dirname,
        '../../../packages/next-devtools-mcp-server/dist/index.js'
      )
      mcpClient = new McpClient(mcpServerPath)
    })

    afterAll(async () => {
      if (mcpClient) {
        await mcpClient.close()
      }
    })

    async function callGetPageMetadata(): Promise<string> {
      const result = await mcpClient.callTool('get_page_metadata', {
        baseUrl: next.url,
      })
      return result.result?.content?.[0]?.text || ''
    }

    it('should return metadata showing pages router type', async () => {
      await next.browser('/')

      let metadata: string = ''
      await retry(async () => {
        metadata = await callGetPageMetadata()
        expect(metadata).toContain('Page metadata from 1 browser session')
      })

      expect(stripAnsi(metadata)).toMatchInlineSnapshot(`
        "# Page metadata from 1 browser session(s)

        ## Session: /

        **Router type:** pages

        *No segments found*

        ---"
      `)
    })

    it('should show pages router type for about page', async () => {
      await next.browser('/about')

      let metadata: string = ''
      await retry(async () => {
        metadata = await callGetPageMetadata()
        expect(metadata).toContain('Page metadata from 1 browser session')
      })

      expect(stripAnsi(metadata)).toMatchInlineSnapshot(`
        "# Page metadata from 1 browser session(s)

        ## Session: /about

        **Router type:** pages

        *No segments found*

        ---"
      `)
    })
  })
})

async function launchStandaloneSession(
  appPortOrUrl: string | number,
  url: string
) {
  const headless = !!process.env.HEADLESS
  const browserName = (process.env.BROWSER_NAME || 'chrome').toLowerCase()

  let browser: Browser
  if (browserName === 'safari') {
    browser = await webkit.launch({ headless })
  } else if (browserName === 'firefox') {
    browser = await firefox.launch({ headless })
  } else {
    browser = await chromium.launch({ headless })
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  const fullUrl = getFullUrl(appPortOrUrl, url)

  await page.goto(fullUrl, { waitUntil: 'load' })

  return {
    page,
    close: async () => {
      await page.close().catch(() => {})
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    },
  }
}

function getFullUrl(appPortOrUrl: string | number, url: string): string {
  const appUrl =
    typeof appPortOrUrl === 'string'
      ? appPortOrUrl
      : `http://localhost:${appPortOrUrl}`
  return url.startsWith('/') ? `${appUrl}${url}` : url
}
