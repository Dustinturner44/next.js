import { useEffect } from 'react'
import { useSegmentTree } from '../segment-explorer-trie'
import {
  collectClientData,
  sendClientDataToMcp,
} from '../agent/client-data-collector'
import { collectErrorData, sendErrorDataToMcp } from '../agent/error-collector'
import { useDevOverlayContext } from '../../dev-overlay.browser'
import type { ReadyRuntimeError } from '../utils/get-error-by-type'

// Combined hook for MCP initialization - receives errors from RenderError via props
export function useDaemonInit(
  runtimeErrors: ReadyRuntimeError[],
  totalErrorCount: number
) {
  const segmentTrieRoot = useSegmentTree()
  const { state } = useDevOverlayContext()

  // Collect and send client data on hydration
  useEffect(() => {
    const collectAndSendData = async () => {
      try {
        const clientData = collectClientData(segmentTrieRoot)
        await sendClientDataToMcp(clientData)
        console.log('[DaemonInit] Client data sent to MCP server')
      } catch (error) {
        console.error('[DaemonInit] Failed to send client data:', error)
      }
    }

    // Small delay to ensure everything is hydrated
    const timeoutId = setTimeout(collectAndSendData, 1000)
    return () => clearTimeout(timeoutId)
  }, [segmentTrieRoot])

  // Sync error data when errors change
  useEffect(() => {
    const syncErrorData = async () => {
      try {
        const errorData = collectErrorData(
          state.buildError,
          runtimeErrors,
          state.isErrorOverlayOpen
        )
        await sendErrorDataToMcp(errorData)
        console.log('[DaemonInit] Error data synced to MCP server')
      } catch (error) {
        console.error('[DaemonInit] Failed to sync error data:', error)
      }
    }

    // Sync whenever dependencies change
    syncErrorData()
  }, [
    state.buildError,
    runtimeErrors,
    totalErrorCount,
    state.isErrorOverlayOpen,
  ])
}
