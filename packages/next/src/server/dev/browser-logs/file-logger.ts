import { promises as fs } from 'fs'
import { join } from 'path'
import type { ServerLogEntry } from '../../../next-devtools/shared/forward-logs-shared'
import { stripFormatSpecifiers, restoreUndefined } from './receive-logs'
import type { MappingContext } from './source-map'

// Singleton instance to ensure one log file per dev session
let globalFileLogger: FileLogger | null = null

export class FileLogger {
  private logFilePath: string
  private writeQueue: string[] = []
  private isWriting = false
  private logsDir: string
  private logIndex = 0 // Counter for log entries

  constructor(distDir: string) {
    this.logsDir = distDir
    this.logFilePath = join(distDir, `next-session.log`)
  }

  static getInstance(distDir: string): FileLogger {
    if (!globalFileLogger) {
      globalFileLogger = new FileLogger(distDir)
    }
    return globalFileLogger
  }

  private formatTimestamp(): string {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  private async ensureLogFile(): Promise<void> {
    try {
      await fs.access(this.logFilePath)
    } catch {
      // create logs dir if it doesn't exist
      await fs.mkdir(this.logsDir, { recursive: true })
      // File doesn't exist, create it
      await fs.writeFile(this.logFilePath, '', 'utf8')
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) {
      return
    }

    this.isWriting = true
    try {
      await this.ensureLogFile()
      const content = this.writeQueue.join('')
      this.writeQueue = []
      await fs.appendFile(this.logFilePath, content, 'utf8')
    } catch (error) {
      // If writing fails, put the content back in the queue
      console.error('Failed to write to log file:', error)
    } finally {
      this.isWriting = false
    }

    // If more items were added while we were writing, flush again
    if (this.writeQueue.length > 0) {
      setImmediate(() => this.flushQueue())
    }
  }

  private formatLogEntry(
    type: string,
    message: string,
    context: string,
    stack?: string
  ): string {
    const timestamp = this.formatTimestamp()
    const typeCapitalized =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()

    // Format: [12:18:41.157] [Server]  Log   message
    // Pad context and type for alignment
    const contextPadded = context.padEnd(7) // "Server " or "Browser"
    const typePadded = typeCapitalized.padEnd(5) // "Log  " or "Error"
    let logLine = `[${timestamp}] [${contextPadded}] ${typePadded} ${message}`

    if (stack) {
      // Format stack trace with proper indentation to align with message content
      const stackLines = stack
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      if (stackLines.length > 0) {
        // Indent to align with message: [timestamp] [context] type message
        const indent = ' '.repeat(
          timestamp.length + context.length + typePadded.length + 7
        ) // 7 = brackets and spaces
        logLine +=
          '\n' + stackLines.map((line) => `${indent}${line}`).join('\n')
      }
    }

    return logLine + '\n'
  }

  private serializeArgs(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg
        } else if (arg && typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        } else {
          return String(arg)
        }
      })
      .join(' ')
  }

  async logEntry(entry: ServerLogEntry, ctx?: MappingContext): Promise<void> {
    let type: string
    let message: string
    let stack: string | undefined

    // Determine context from mapping context
    let context = 'Browser' // Default to browser for client logs
    if (ctx) {
      if (ctx.isServer || ctx.isEdgeServer) {
        context = 'Server' // Treat both server and edge as "Server"
      }
    }

    switch (entry.kind) {
      case 'console': {
        type = entry.method

        // Process args similar to how it's done in receive-logs.ts
        const processedArgs = await Promise.all(
          entry.args.map(async (arg) => {
            if (arg.kind === 'arg') {
              try {
                const data =
                  typeof arg.data === 'string' ? JSON.parse(arg.data) : arg.data
                return restoreUndefined(data)
              } catch {
                return restoreUndefined(arg.data)
              }
            } else if (arg.kind === 'formatted-error-arg') {
              // Skip stack processing for formatted errors
              return arg.prefix
            }
          })
        )

        message = this.serializeArgs(processedArgs)

        // Skip stack traces for console logs
        break
      }

      case 'any-logged-error': {
        type = 'error'

        const processedArgs = await Promise.all(
          entry.args.map(async (arg) => {
            if (arg.kind === 'arg') {
              try {
                const data =
                  typeof arg.data === 'string' ? JSON.parse(arg.data) : arg.data
                return restoreUndefined(data)
              } catch {
                return restoreUndefined(arg.data)
              }
            } else if (arg.kind === 'formatted-error-arg') {
              // Skip stack processing for formatted errors
              return arg.prefix
            }
          })
        )

        message = this.serializeArgs(stripFormatSpecifiers(processedArgs))

        // Skip stack traces for logged errors too
        break
      }

      case 'formatted-error': {
        type = 'error'
        message = entry.prefix
        // Skip stack traces for formatted errors too
        break
      }

      default: {
        type = 'unknown'
        message = 'Unknown log entry type'
        break
      }
    }

    const logLine = this.formatLogEntry(type, message, context, stack)
    this.writeQueue.push(logLine)

    // Use setImmediate to avoid blocking the current execution
    setImmediate(() => this.flushQueue())
  }

  // Method to log server-side messages directly
  async logServerMessage(
    level: 'log' | 'info' | 'warn' | 'error' | 'debug',
    message: string
  ): Promise<void> {
    const logLine = this.formatLogEntry(level, message, 'Server')
    this.writeQueue.push(logLine)
    setImmediate(() => this.flushQueue())
  }

  async close(): Promise<void> {
    // Flush any remaining logs
    await this.flushQueue()
  }
}
