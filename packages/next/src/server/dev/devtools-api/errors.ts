import type { ServerResponse } from 'http'
import type { HmrMessageSentToBrowser } from '../hot-reloader-types'
import type { OverlayState } from '../../../next-devtools/dev-overlay/shared'
import { HMR_MESSAGE_SENT_TO_BROWSER } from '../hot-reloader-types'
import { createBrowserRequest } from '../../lib/devtools-api-utils/tools/utils/browser-communication'
import { formatErrors } from '../../lib/devtools-api-utils/tools/utils/format-errors'

export async function handleErrorsRequest(
  res: ServerResponse,
  sendHmrMessage: (message: HmrMessageSentToBrowser) => void,
  getActiveConnectionCount: () => number
): Promise<void> {
  const connectionCount = getActiveConnectionCount()

  if (connectionCount === 0) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message:
          'No browser sessions connected. Please open your application in a browser to retrieve error state.',
        hasErrors: false,
        errors: {},
      })
    )
    return
  }

  const responses = await createBrowserRequest<OverlayState>(
    HMR_MESSAGE_SENT_TO_BROWSER.REQUEST_CURRENT_ERROR_STATE,
    sendHmrMessage,
    getActiveConnectionCount,
    5000
  )

  const errorsByUrl = new Map<string, OverlayState>()
  for (const response of responses) {
    if (response.data) {
      errorsByUrl.set(response.url, response.data)
    }
  }

  const hasErrors = Array.from(errorsByUrl.values()).some(
    (state) => state.errors.length > 0 || !!state.buildError
  )

  if (!hasErrors) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        message:
          responses.length === 0
            ? 'No browser sessions responded.'
            : `No errors detected in ${responses.length} browser session(s).`,
        hasErrors: false,
        errors: {},
      })
    )
    return
  }

  const formattedErrors = await formatErrors(errorsByUrl)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      hasErrors: true,
      errors: Object.fromEntries(errorsByUrl),
      formatted: formattedErrors,
    })
  )
}
