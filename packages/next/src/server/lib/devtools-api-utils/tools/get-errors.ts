/**
 * Devtools API handler for retrieving browser error state.
 *
 * This handler demonstrates server-to-browser communication in Next.js dev mode.
 * It leverages the existing HMR infrastructure rather than creating new channels.
 *
 * Flow:
 *   Devtools API client → server generates request ID → HMR message to browser →
 *   browser queries error overlay state → HMR response back → server performs source mapping →
 *   formatted output.
 */
import type { OverlayState } from '../../../../next-devtools/dev-overlay/shared'
import { handleBrowserPageResponse } from './utils/browser-communication'

export function handleErrorStateResponse(
  requestId: string,
  errorState: OverlayState | null,
  url: string | undefined
) {
  handleBrowserPageResponse<OverlayState | null>(
    requestId,
    errorState,
    url || ''
  )
}
