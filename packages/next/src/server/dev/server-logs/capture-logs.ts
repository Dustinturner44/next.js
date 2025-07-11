import type { HMR_ACTION_TYPES } from '../hot-reloader-types'
import { HMR_ACTIONS_SENT_TO_BROWSER } from '../hot-reloader-types'

type LogEntry = {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  args: any[]
  timestamp: number
  source: 'server-action' | 'server' | 'edge-server'
}

export class ServerLogCapture {
  private sendToClient?: (action: HMR_ACTION_TYPES) => void
  private logQueue: LogEntry[] = []
  public id: string

  constructor() {
    this.id = Math.random().toString(36).substring(2, 15)
  }

  setSendFunction(sendFn: (action: HMR_ACTION_TYPES) => void) {
    // console.trace('setSendFunction', sendFn, this.id)
    this.sendToClient = sendFn
  }

  captureLog(level: string, args: any[], source: string) {
    const entry: LogEntry = {
      level: level as any,
      args: this.serializeArgs(args),
      timestamp: Date.now(),
      source: source as any
    }

    this.logQueue.push(entry)
    this.scheduleFlush()
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Handle circular references and non-serializable objects
          return JSON.parse(JSON.stringify(arg, (key, value) => {
            if (typeof value === 'function') {
              return `[Function: ${value.name || 'anonymous'}]`
            }
            if (typeof value === 'undefined') {
              return '[undefined]'
            }
            if (typeof value === 'symbol') {
              return `[Symbol: ${value.toString()}]`
            }
            return value
          }))
        } catch (error) {
          return `[Object: ${Object.prototype.toString.call(arg)}]`
        }
      }
      return arg
    })
  }

  private flushTimeout?: NodeJS.Timeout
  
  private scheduleFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }
    
    // Batch logs and send them after a short delay to avoid flooding
    this.flushTimeout = setTimeout(() => {
      this.flushLogs()
    }, 10)
  }

  private flushLogs() {
    console.log('flushLogs', this.sendToClient, this.logQueue.length)
    if (this.sendToClient && this.logQueue.length > 0) {
      this.sendToClient({
        action: HMR_ACTIONS_SENT_TO_BROWSER.SERVER_LOGS,
        entries: [...this.logQueue]
      })
      this.logQueue = []
    }
  }

  disable() {
    this.sendToClient = undefined
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }
    this.logQueue = []
  }
}

// Export the class so it can be instantiated where needed
// The instance will be created in setup-dev-bundler and passed through serverFields