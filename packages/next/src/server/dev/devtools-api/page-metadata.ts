import type { ServerResponse } from 'http'
import type { HmrMessageSentToBrowser } from '../hot-reloader-types'
import type { PageMetadata } from '../../../shared/lib/devtools-api-types'
import { HMR_MESSAGE_SENT_TO_BROWSER } from '../hot-reloader-types'
import { createBrowserRequest } from '../../lib/devtools-api-utils/tools/utils/browser-communication'

export async function handlePageMetadataRequest(
  res: ServerResponse,
  projectPath: string,
  sendHmrMessage: (message: HmrMessageSentToBrowser) => void,
  getActiveConnectionCount: () => number
): Promise<void> {
  const connectionCount = getActiveConnectionCount()

  if (connectionCount === 0) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message: 'No browser sessions connected.',
        metadata: {},
        projectPath,
      })
    )
    return
  }

  const responses = await createBrowserRequest<PageMetadata>(
    HMR_MESSAGE_SENT_TO_BROWSER.REQUEST_PAGE_METADATA,
    sendHmrMessage,
    getActiveConnectionCount,
    5000
  )

  const metadataByUrl = new Map<string, PageMetadata>()
  for (const response of responses) {
    if (response.data) {
      metadataByUrl.set(response.url, response.data)
    }
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      metadata: Object.fromEntries(metadataByUrl),
      projectPath,
    })
  )
}
