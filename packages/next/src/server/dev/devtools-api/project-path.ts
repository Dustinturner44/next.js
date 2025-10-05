import type { ServerResponse } from 'http'

export async function handleProjectPathRequest(
  res: ServerResponse,
  projectPath: string
): Promise<void> {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ projectPath }))
}
