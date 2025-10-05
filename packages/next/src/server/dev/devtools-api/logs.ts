import type { ServerResponse } from 'http'
import { getFileLogger } from '../browser-logs/file-logger'
import { stat } from 'fs/promises'

export async function handleLogsRequest(
  res: ServerResponse,
  _distDir: string
): Promise<void> {
  const fileLogger = getFileLogger()
  const logFilePath = fileLogger.getLogFilePath()

  if (!logFilePath) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({ logFilePath: '', error: 'Log file not initialized' })
    )
    return
  }

  try {
    await stat(logFilePath)
  } catch (error) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        logFilePath: '',
        error: `Log file not found at ${logFilePath}`,
      })
    )
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ logFilePath }))
}
