import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { retry } from 'next-test-utils'
import { initializeMCPSession } from './utils/mcp-test-utils'

describe('mcp-server stack frames resolution', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'default-template')),
  })

  it('should capture real error stack frames and resolve them via MCP', async () => {
    const browser = await next.browser('/error-test-button')
    await browser.waitForElementByCss('#trigger-error-button')

    // Intercept the overlay's stack frame resolution request
    await browser.eval(() => {
      ;(window as any).interceptedRequest = null
      const originalFetch = window.fetch
      window.fetch = function (...args) {
        const [url, options] = args
        if (
          typeof url === 'string' &&
          url.includes('__nextjs_original-stack-frames')
        ) {
          if (options?.body) {
            try {
              ;(window as any).interceptedRequest = JSON.parse(
                options.body as string
              )
            } catch (e) {}
          }
        }
        return originalFetch.apply(this, args)
      }
    })

    // Trigger the error
    await browser.elementByCss('#trigger-error-button').click()

    // Wait for error overlay
    await retry(async () => {
      const hasOverlay = await browser.eval(
        () => document.querySelector('nextjs-portal') !== null
      )
      expect(hasOverlay).toBe(true)
    })

    // Get the intercepted request with real bundled frames
    await retry(async () => {
      const req = await browser.eval(() => (window as any).interceptedRequest)
      expect(req).toBeTruthy()
    })

    const interceptedRequest = await browser.eval(
      () => (window as any).interceptedRequest
    )
    expect(interceptedRequest).toBeTruthy()
    expect(interceptedRequest.frames).toBeTruthy()
    expect(interceptedRequest.frames.length).toBeGreaterThan(0)

    // Verify we have real bundled paths
    const firstFrame = interceptedRequest.frames[0]
    expect(firstFrame.file).toMatch(
      /webpack-internal:\/\/|turbopack:\/\/|file:\/\/.*\/.next\//
    )

    // Test MCP resolution with real frames
    const mcpEndpoint = `${next.url}/_next/mcp`

    // Initialize MCP
    await initializeMCPSession(mcpEndpoint, 'init')

    // Call resolve_stack_frames with real intercepted frames
    const resolveResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'resolve',
        method: 'tools/call',
        params: {
          name: 'resolve_stack_frames',
          arguments: interceptedRequest,
        },
      }),
    })

    const resolveText = await resolveResponse.text()
    const match = resolveText.match(/data: ({.*})/s)
    expect(match).toBeTruthy()

    const result = JSON.parse(match![1])
    if (result.error) {
      throw new Error(`MCP error: ${JSON.stringify(result.error)}`)
    }

    const content = result.result?.content
    expect(content).toBeInstanceOf(Array)
    expect(content.length).toBeGreaterThan(0)
    expect(content[0].type).toBe('text')

    // Parse the JSON response
    const resolvedFrames = JSON.parse(content[0].text)
    expect(resolvedFrames).toBeInstanceOf(Array)
    expect(resolvedFrames.length).toBeGreaterThan(0)

    // Verify resolution worked
    const resolved = resolvedFrames[0]
    if (resolved.status === 'fulfilled') {
      const { originalStackFrame, originalCodeFrame } = resolved.value
      expect(originalStackFrame).toBeTruthy()
      expect(originalStackFrame.file).toContain('error-test-button/page.tsx')
      expect(originalStackFrame.methodName).toContain('ErrorTestButtonPage')

      if (originalCodeFrame) {
        expect(originalCodeFrame).toContain('throw new Error')
      }
    }

    await browser.close()
  })
})
