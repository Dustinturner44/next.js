import type { ServerResponse } from 'http'
import { getServerActionInfo } from '../../lib/devtools-api-utils/tools/get-server-action-by-id'

export async function handleServerActionRequest(
  res: ServerResponse,
  distDir: string,
  id: string | null
): Promise<void> {
  if (!id) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing id parameter' }))
    return
  }

  const info = await getServerActionInfo(distDir, id)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(info))
}
