// RPC utilities for communicating with instrumented iframes
// Similar to Playwright's page.evaluate() API

export interface RpcError {
  message: string
  stack?: string
  name: string
}

export interface RpcResponse<T = any> {
  id: string
  success: boolean
  result?: T
  error?: RpcError
}

export class Dev0RPC {
  private iframe: HTMLIFrameElement
  private rpcId = 0
  private pendingCalls = new Map<
    string,
    {
      resolve: (value: any) => void
      reject: (error: Error) => void
      timeout: NodeJS.Timeout
    }
  >()

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe

    // Listen for responses from iframe
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage = (event: MessageEvent) => {
    // Verify it's from our iframe
    if (event.source !== this.iframe.contentWindow) return

    const { type, id, result, error, success } = event.data || {}

    if (type === 'dev0-rpc-response' && id) {
      const pending = this.pendingCalls.get(id)
      if (pending) {
        clearTimeout(pending.timeout)
        this.pendingCalls.delete(id)

        if (success) {
          pending.resolve(result)
        } else {
          const err = new Error(error?.message || 'RPC call failed')
          err.name = error?.name || 'RpcError'
          if (error?.stack) {
            err.stack = error.stack
          }
          pending.reject(err)
        }
      }
    }
  }

  /**
   * Execute a function in the iframe context
   * Similar to Playwright's page.evaluate()
   *
   * @param fn Function to execute (must not close over variables)
   * @param args Arguments to pass to the function
   * @param timeout Timeout in milliseconds (default: 5000)
   */
  async evaluate<T = any, Args extends any[] = any[]>(
    fn: (...args: Args) => T | Promise<T>,
    args: Args = [] as any,
    timeout = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `rpc-${++this.rpcId}`

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingCalls.delete(id)
        reject(new Error(`RPC call timed out after ${timeout}ms`))
      }, timeout)

      // Store pending call
      this.pendingCalls.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      })

      // Send RPC call to iframe
      this.iframe.contentWindow?.postMessage(
        {
          type: 'dev0-rpc-call',
          id,
          fn: fn.toString(),
          args,
        },
        '*'
      )
    })
  }

  /**
   * Get an element by selector (similar to page.$)
   */
  async $(selector: string) {
    return this.evaluate(
      (sel) => {
        const element = document.querySelector(sel)
        if (!element) return null

        return {
          tagName: element.tagName,
          textContent: element.textContent,
          innerHTML: element.innerHTML,
          className: element.className,
          id: element.id,
        }
      },
      [selector]
    )
  }

  /**
   * Get multiple elements by selector (similar to page.$$)
   */
  async $$(selector: string) {
    return this.evaluate(
      (sel) => {
        const elements = Array.from(document.querySelectorAll(sel))
        return elements.map((element) => ({
          tagName: element.tagName,
          textContent: element.textContent,
          innerHTML: element.innerHTML,
          className: element.className,
          id: element.id,
        }))
      },
      [selector]
    )
  }

  /**
   * Click an element by selector
   */
  async click(selector: string) {
    return this.evaluate(
      (sel) => {
        const element = document.querySelector(sel) as HTMLElement
        if (!element) throw new Error(`Element not found: ${sel}`)
        element.click()
        return true
      },
      [selector]
    )
  }

  /**
   * Type text into an input by selector
   */
  async type(selector: string, text: string) {
    return this.evaluate(
      (sel, txt) => {
        const element = document.querySelector(sel) as HTMLInputElement
        if (!element) throw new Error(`Element not found: ${sel}`)
        element.value = txt
        element.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      },
      [selector, text]
    )
  }

  /**
   * Get the page title
   */
  async title() {
    return this.evaluate(() => document.title)
  }

  /**
   * Get the current URL
   */
  async url() {
    return this.evaluate(() => window.location.href)
  }

  /**
   * Wait for an element to appear
   */
  async waitForSelector(selector: string, timeout = 5000): Promise<any> {
    return this.evaluate(
      (sel: string, timeoutMs: number) => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(sel)
          if (element) {
            resolve({
              tagName: element.tagName,
              textContent: element.textContent,
              className: element.className,
              id: element.id,
            })
            return
          }

          const observer = new MutationObserver(() => {
            const element = document.querySelector(sel)
            if (element) {
              observer.disconnect()
              clearTimeout(timeoutHandle)
              resolve({
                tagName: element.tagName,
                textContent: element.textContent,
                className: element.className,
                id: element.id,
              })
            }
          })

          const timeoutHandle = setTimeout(() => {
            observer.disconnect()
            reject(new Error(`Element not found within ${timeoutMs}ms: ${sel}`))
          }, timeoutMs)

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          })
        })
      },
      [selector, timeout]
    )
  }

  /**
   * Clean up event listeners
   */
  dispose() {
    window.removeEventListener('message', this.handleMessage)

    // Clear any pending calls
    for (const pending of this.pendingCalls.values()) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('RPC client disposed'))
    }
    this.pendingCalls.clear()
  }
}
