import type { ServerResponse, IncomingMessage } from 'http'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { middlewareResponse } from './middleware-response'
import * as Log from '../../build/output/log'

const SOURCE_CODE_PREFIX = '/__nextjs_source_code'

export function getSourceCodeMiddleware(projectDir: string) {
  return async function sourceCodeMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    try {
      const { pathname, searchParams } = new URL(`http://n${req.url}`)

      if (!pathname.startsWith(SOURCE_CODE_PREFIX)) {
        return next()
      }

      if (req.method !== 'GET') {
        return middlewareResponse.methodNotAllowed(res)
      }

      const filePath = searchParams.get('file')
      if (!filePath) {
        return middlewareResponse.badRequest(res)
      }

      // Security: ensure the file path is within the project directory
      const absoluteFilePath = resolve(
        projectDir,
        filePath.startsWith('/') ? filePath.slice(1) : filePath
      )

      // Additional security check to prevent directory traversal
      if (!absoluteFilePath.startsWith(resolve(projectDir))) {
        Log.warn(
          `Attempted to access file outside project directory: ${filePath}`
        )
        return middlewareResponse.badRequest(res)
      }

      try {
        const content = await readFile(absoluteFilePath, 'utf-8')

        // Set appropriate headers
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.statusCode = 200
        res.end(content)
      } catch (fileError) {
        if ((fileError as NodeJS.ErrnoException).code === 'ENOENT') {
          Log.warn(`Source file not found: ${absoluteFilePath}`)
          return middlewareResponse.notFound(res)
        } else {
          Log.error(`Error reading source file ${absoluteFilePath}:`, fileError)
          return middlewareResponse.internalServerError(res, fileError)
        }
      }
    } catch (err) {
      Log.error(
        'Failed to serve source code:',
        err instanceof Error ? err.message : err
      )
      return middlewareResponse.internalServerError(res, err)
    }
  }
}
