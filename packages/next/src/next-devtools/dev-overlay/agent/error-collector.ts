import type { ReadyRuntimeError } from '../utils/get-error-by-type'
import type { OriginalStackFrame } from '../../shared/stack-frame'

export interface CollectedError {
  id: string
  type: 'build' | 'runtime' | 'console' | 'recoverable'
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
    environmentName?: string
  }
  frames?: Array<{
    file: string | null
    methodName: string
    arguments: string[]
    line1: number | null
    column1: number | null
  }>
  codeFrame?: string
  hydrationWarning?: string | null
  notes?: string | null
  reactOutputComponentDiff?: string | null
}

export interface ErrorsData {
  buildError: string | null
  runtimeErrors: CollectedError[]
  totalErrorCount: number
  isErrorOverlayOpen: boolean
  lastUpdated: string
}

/**
 * Collects error data from the dev overlay state
 */
export function collectErrorData(
  buildError: string | null,
  runtimeErrors: ReadyRuntimeError[],
  isErrorOverlayOpen: boolean
): ErrorsData {
  const collectedErrors: CollectedError[] = runtimeErrors.map((error) => {
    // Handle frames which can be either an array or a function
    let framesData:
      | Array<{
          file: string | null
          methodName: string
          arguments: string[]
          line1: number | null
          column1: number | null
        }>
      | undefined

    if (error.frames && Array.isArray(error.frames)) {
      framesData = error.frames.map((frame: OriginalStackFrame) => ({
        file:
          frame.originalStackFrame?.file ||
          frame.sourceStackFrame?.file ||
          null,
        methodName:
          frame.originalStackFrame?.methodName ||
          frame.sourceStackFrame?.methodName ||
          '',
        arguments:
          frame.originalStackFrame?.arguments ||
          frame.sourceStackFrame?.arguments ||
          [],
        line1:
          frame.originalStackFrame?.line1 ||
          frame.sourceStackFrame?.line1 ||
          null,
        column1:
          frame.originalStackFrame?.column1 ||
          frame.sourceStackFrame?.column1 ||
          null,
      }))
    }
    // If frames is a function, we can't get the data synchronously here
    // The frames will be resolved on the client side before sending

    return {
      id: error.id.toString(),
      type: error.type,
      timestamp: new Date().toISOString(),
      error: {
        name: error.error.name,
        message: error.error.message,
        stack: error.error.stack,
        environmentName:
          'environmentName' in error.error
            ? (error.error as any).environmentName
            : undefined,
      },
      frames: framesData,
      codeFrame:
        (Array.isArray(error.frames) && error.frames[0]?.originalCodeFrame) ||
        undefined,
    }
  })

  return {
    buildError,
    runtimeErrors: collectedErrors,
    totalErrorCount: collectedErrors.length + (buildError ? 1 : 0),
    isErrorOverlayOpen,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Sends error data to the MCP middleware
 */
export async function sendErrorDataToMcp(
  errorsData: ErrorsData
): Promise<void> {
  try {
    console.log('[ErrorCollector] Sending error data to MCP:', {
      buildError: !!errorsData.buildError,
      runtimeErrorCount: errorsData.runtimeErrors.length,
      totalErrorCount: errorsData.totalErrorCount,
    })

    const response = await fetch('/_next/mcp/error-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorsData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('[ErrorCollector] Error data sent successfully')
  } catch (error) {
    console.error('[ErrorCollector] Failed to send error data:', error)
    // Don't throw - this is non-critical
  }
}
