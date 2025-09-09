import type { SegmentTrieNode } from '../segment-explorer-trie'

export interface ClientData {
  userAgent: string
  viewport: {
    width: number
    height: number
  }
  url: string
  timestamp: string
  segmentTrie: SerializableSegmentTrieNode
  performance: {
    navigationStart: number
    loadEventEnd: number
    domContentLoadedEventEnd: number
  }
  location: {
    pathname: string
    search: string
    hash: string
    origin: string
  }
}

export interface SerializableSegmentTrieNode {
  value?: {
    type: string
    pagePath: string
    boundaryType: string | null
  }
  children: {
    [key: string]: SerializableSegmentTrieNode | undefined
  }
}

/**
 * Converts a SegmentTrieNode to a serializable format
 */
function serializeSegmentTrieNode(
  node: SegmentTrieNode
): SerializableSegmentTrieNode {
  return {
    value: node.value
      ? {
          type: node.value.type,
          pagePath: node.value.pagePath,
          boundaryType: node.value.boundaryType,
          // Exclude functions like setBoundaryType
        }
      : undefined,
    children: Object.fromEntries(
      Object.entries(node.children).map(([key, child]) => [
        key,
        child ? serializeSegmentTrieNode(child) : undefined,
      ])
    ),
  }
}

/**
 * Collects comprehensive client data when the page is hydrated
 */
export function collectClientData(
  segmentTrieRoot: SegmentTrieNode
): ClientData {
  return {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    url: window.location.href,
    timestamp: new Date().toISOString(),
    segmentTrie: serializeSegmentTrieNode(segmentTrieRoot),
    performance: {
      navigationStart: performance.timing?.navigationStart || 0,
      loadEventEnd: performance.timing?.loadEventEnd || 0,
      domContentLoadedEventEnd:
        performance.timing?.domContentLoadedEventEnd || 0,
    },
    location: {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
    },
  }
}

/**
 * Sends client data to the MCP middleware
 */
export async function sendClientDataToMcp(
  clientData: ClientData
): Promise<void> {
  try {
    console.log(
      '[ClientDataCollector] Sending client data to MCP middleware:',
      clientData
    )

    const response = await fetch('/_next/mcp/client-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('[ClientDataCollector] Client data sent successfully')
  } catch (error) {
    console.error('[ClientDataCollector] Failed to send client data:', error)
    // Don't throw - this is non-critical
  }
}

/**
 * Hook to collect and send client data on hydration
 */
export function useClientDataCollection(segmentTrieRoot: SegmentTrieNode) {
  const collectAndSend = async () => {
    const clientData = collectClientData(segmentTrieRoot)
    await sendClientDataToMcp(clientData)
  }

  return { collectAndSend }
}
