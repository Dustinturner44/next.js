import type { IncomingMessage, ServerResponse } from 'http'
import { readFile } from 'fs/promises'
import { join } from 'path'

const MODULE_LAYER_ENDPOINT = '/__nextjs_module_layers'

interface ModuleLayerInfo {
  version: number
  timestamp: number
  modules: Record<string, { layers: string[]; routes: string[] }>
}

export function moduleLayerMiddleware({ distDir }: { distDir: string }) {
  return async function moduleLayerMiddlewareHandler(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    if (url.pathname !== MODULE_LAYER_ENDPOINT) {
      return next()
    }

    try {
      // Try both possible locations
      const possiblePaths = [
        join(distDir, 'module-layer-info.json'),
        join(distDir, 'dev', 'module-layer-info.json'),
      ]

      let content: string | null = null
      for (const filePath of possiblePaths) {
        try {
          content = await readFile(filePath, 'utf-8')
          break
        } catch {
          // Try next path
        }
      }

      if (!content) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: 'Module layer info not available yet. Wait for compilation.',
          })
        )
        return
      }

      // Check if querying a specific file
      const fileQuery = url.searchParams.get('file')
      if (fileQuery) {
        const data: ModuleLayerInfo = JSON.parse(content)
        const normalizedQuery = fileQuery.replace(/\\/g, '/')

        // Find matching module
        let result: {
          file: string
          layers: string[]
          routes: string[]
        } | null = null

        for (const [modulePath, info] of Object.entries(data.modules)) {
          if (
            modulePath.endsWith(normalizedQuery) ||
            modulePath.includes(normalizedQuery)
          ) {
            result = {
              file: modulePath,
              layers: info.layers,
              routes: info.routes,
            }
            break
          }
        }

        if (result) {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
          return
        }

        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: `File "${fileQuery}" not found in module graph`,
            hint: 'File may not be imported by any route yet. Try visiting a page that imports it.',
            availableModules: Object.keys(data.modules).slice(0, 20),
          })
        )
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(content)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: String(error),
        })
      )
    }
  }
}
