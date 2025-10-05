import type { ServerResponse, IncomingMessage } from 'http'
import type { HmrMessageSentToBrowser } from './hot-reloader-types'
import { handleProjectPathRequest } from './devtools-api/project-path'
import { handleErrorsRequest } from './devtools-api/errors'
import { handlePageMetadataRequest } from './devtools-api/page-metadata'
import { handleLogsRequest } from './devtools-api/logs'
import { handleServerActionRequest } from './devtools-api/server-action'

export function getDevtoolsApiMiddleware(
  projectPath: string,
  distDir: string,
  sendHmrMessage: (message: HmrMessageSentToBrowser) => void,
  getActiveConnectionCount: () => number
) {
  return async function (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const { pathname } = new URL(req.url || '', 'http://n')

    if (!pathname.startsWith('/_next/devtools-api')) {
      return next()
    }

    try {
      if (pathname === '/_next/devtools-api/project-path') {
        await handleProjectPathRequest(res, projectPath)
      } else if (pathname === '/_next/devtools-api/errors') {
        await handleErrorsRequest(res, sendHmrMessage, getActiveConnectionCount)
      } else if (pathname === '/_next/devtools-api/page-metadata') {
        await handlePageMetadataRequest(
          res,
          projectPath,
          sendHmrMessage,
          getActiveConnectionCount
        )
      } else if (pathname === '/_next/devtools-api/logs') {
        await handleLogsRequest(res, distDir)
      } else if (pathname.startsWith('/_next/devtools-api/server-action')) {
        const url = new URL(req.url || '', 'http://n')
        const id = url.searchParams.get('id')
        await handleServerActionRequest(res, distDir, id)
      } else {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Not found' }))
      }
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error:
              error instanceof Error ? error.message : 'Internal server error',
          })
        )
      }
    }
  }
}
