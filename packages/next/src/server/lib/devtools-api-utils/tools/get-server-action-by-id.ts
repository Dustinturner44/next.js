import { promises as fs } from 'fs'
import { join } from 'path'

const INLINE_ACTION_PREFIX = '$$RSC_SERVER_ACTION_'

interface ActionEntry {
  workers?: Record<string, unknown>
  layer?: Record<string, string>
  filename: string
  exportedName: string
}

interface ServerReferenceManifest {
  node: Record<string, ActionEntry>
  edge: Record<string, ActionEntry>
  encryptionKey: string
}

interface ServerActionInfo {
  id: string
  runtime?: 'node' | 'edge'
  filename?: string
  functionName?: string
  layer?: Record<string, string>
  workers?: Record<string, unknown>
  error?: string
}

export async function getServerActionInfo(
  distDir: string,
  actionId: string
): Promise<ServerActionInfo> {
  if (!actionId) {
    return {
      id: actionId,
      error: 'actionId parameter is required',
    }
  }

  const manifestPath = join(distDir, 'server', 'server-reference-manifest.json')

  let manifestContent: string
  try {
    manifestContent = await fs.readFile(manifestPath, 'utf-8')
  } catch (error) {
    return {
      id: actionId,
      error: `Could not read server-reference-manifest.json at ${manifestPath}.`,
    }
  }

  const manifest: ServerReferenceManifest = JSON.parse(manifestContent)

  if (manifest.node && manifest.node[actionId]) {
    const entry = manifest.node[actionId]
    const isInlineAction = entry.exportedName.startsWith(INLINE_ACTION_PREFIX)
    return {
      id: actionId,
      runtime: 'node',
      filename: entry.filename,
      functionName: isInlineAction
        ? 'inline server action'
        : entry.exportedName,
      layer: entry.layer,
      workers: entry.workers,
    }
  }

  if (manifest.edge && manifest.edge[actionId]) {
    const entry = manifest.edge[actionId]
    const isInlineAction = entry.exportedName.startsWith(INLINE_ACTION_PREFIX)
    return {
      id: actionId,
      runtime: 'edge',
      filename: entry.filename,
      functionName: isInlineAction
        ? 'inline server action'
        : entry.exportedName,
      layer: entry.layer,
      workers: entry.workers,
    }
  }

  return {
    id: actionId,
    error: `Action ID "${actionId}" not found in server-reference-manifest.json`,
  }
}
