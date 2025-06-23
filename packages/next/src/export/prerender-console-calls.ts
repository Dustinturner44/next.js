import { AsyncLocalStorage } from 'node:async_hooks'
import { dim } from '../lib/picocolors'

type InterceptableConsoleMethod =
  | 'error'
  | 'assert'
  | 'debug'
  | 'dir'
  | 'dirxml'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'info'
  | 'log'
  | 'table'
  | 'trace'
  | 'warn'

interface ConsoleContext {
  page: string
}

const consoleContext = new AsyncLocalStorage<ConsoleContext>()

// Based on https://github.com/facebook/react/blob/28dc0776be2e1370fe217549d32aee2519f0cf05/packages/react-server/src/ReactFlightServer.js#L248
function patchConsoleMethod(
  methodName: InterceptableConsoleMethod
): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(console, methodName)
  if (
    descriptor &&
    (descriptor.configurable || descriptor.writable) &&
    typeof descriptor.value === 'function'
  ) {
    const originalMethod = descriptor.value
    const originalName = Object.getOwnPropertyDescriptor(originalMethod, 'name')
    const wrapperMethod = function (
      this: typeof console,
      ...args: Parameters<(typeof console)[InterceptableConsoleMethod]>
    ) {
      const context = consoleContext.getStore()

      if (methodName === 'assert' && args[0]) {
        // assert doesn't emit anything unless first argument is falsy so we can skip it.
      } else if (context === undefined) {
        originalMethod.apply(this, args)
      } else {
        originalMethod.call(this, dim(`[Route "${context.page}"]`), ...args)
      }
    }
    if (originalName) {
      Object.defineProperty(wrapperMethod, 'name', originalName)
    }
    Object.defineProperty(console, methodName, {
      value: wrapperMethod,
    })

    return () => {
      Object.defineProperty(console, methodName, {
        value: originalMethod,
        writable: descriptor.writable,
        configurable: descriptor.configurable,
      })
    }
  }

  return () => {}
}

export function setupConsoleWithContext(): () => void {
  const cleanupConsoleError = patchConsoleMethod('error')
  const cleanupConsoleAssert = patchConsoleMethod('assert')
  const cleanupConsoleDebug = patchConsoleMethod('debug')
  const cleanupConsoleDir = patchConsoleMethod('dir')
  const cleanupConsoleDirxml = patchConsoleMethod('dirxml')
  const cleanupConsoleGroup = patchConsoleMethod('group')
  const cleanupConsoleGroupCollapsed = patchConsoleMethod('groupCollapsed')
  const cleanupConsoleGroupEnd = patchConsoleMethod('groupEnd')
  const cleanupConsoleInfo = patchConsoleMethod('info')
  const cleanupConsoleLog = patchConsoleMethod('log')
  const cleanupConsoleTable = patchConsoleMethod('table')
  const cleanupConsoleTrace = patchConsoleMethod('trace')
  const cleanupConsoleWarn = patchConsoleMethod('warn')

  return () => {
    cleanupConsoleError()
    cleanupConsoleAssert()
    cleanupConsoleDebug()
    cleanupConsoleDir()
    cleanupConsoleDirxml()
    cleanupConsoleGroup()
    cleanupConsoleGroupCollapsed()
    cleanupConsoleGroupEnd()
    cleanupConsoleInfo()
    cleanupConsoleLog()
    cleanupConsoleTable()
    cleanupConsoleTrace()
    cleanupConsoleWarn()
  }
}

export interface WithConsoleContext<T> {
  result: T
  hasReplay: () => boolean
  replay: () => void
}

/**
 * Ensures console calls during the execution of `fn` are prefixed with the provided `page` name.
 */
export function withConsoleContext<T>(page: string, fn: () => T): T {
  const context: ConsoleContext = { page }

  const result = consoleContext.run(context, fn)

  return result
}
