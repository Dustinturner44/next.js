import { handleBrowserPageResponse } from './utils/browser-communication'
import type { SegmentTrieData } from '../../../../shared/lib/devtools-api-types'

export function handlePageMetadataResponse(
  requestId: string,
  segmentTrieData: SegmentTrieData | null,
  url: string | undefined
) {
  handleBrowserPageResponse<SegmentTrieData | null>(
    requestId,
    segmentTrieData,
    url || ''
  )
}
