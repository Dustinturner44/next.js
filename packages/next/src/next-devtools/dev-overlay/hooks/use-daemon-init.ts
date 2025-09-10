import { useEffect } from 'react'
import { useSegmentTree } from '../segment-explorer-trie'
import {
  collectClientData,
  sendClientDataToMcp,
} from '../agent/client-data-collector'

// TODO: should be renamed to mcp init
export function useDaemonInit() {
  const segmentTrieRoot = useSegmentTree()

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
}
