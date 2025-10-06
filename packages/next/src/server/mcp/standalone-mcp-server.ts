import fs from 'fs'
import path from 'path'
import os from 'os'

const DEV_SERVER_REGISTRY_PATH = path.join(
  os.tmpdir(),
  'next-dev-servers.json'
)
const HEARTBEAT_INTERVAL_MS = 30000

interface DevServerInfo {
  port: number
  hostname: string
  pid: number
  projectPath: string
  lastSeen: number
}

interface DevServerRegistry {
  [projectPath: string]: DevServerInfo
}

let heartbeatInterval: NodeJS.Timeout | null = null
let registrationComplete = false

function readRegistryFile(): DevServerRegistry {
  try {
    if (!fs.existsSync(DEV_SERVER_REGISTRY_PATH)) {
      return {}
    }

    const content = fs.readFileSync(DEV_SERVER_REGISTRY_PATH, 'utf-8')
    if (!content.trim()) {
      return {}
    }

    return JSON.parse(content) as DevServerRegistry
  } catch (error) {
    console.error('[MCP] Error reading registry file:', error)
    return {}
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function writeRegistryFile(registry: DevServerRegistry): boolean {
  try {
    const dir = path.dirname(DEV_SERVER_REGISTRY_PATH)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const tempPath = `${DEV_SERVER_REGISTRY_PATH}.${process.pid}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(registry, null, 2), 'utf-8')

    fs.renameSync(tempPath, DEV_SERVER_REGISTRY_PATH)

    return true
  } catch (error) {
    console.error('[MCP] Error writing registry file:', error)
    return false
  }
}

function updateHeartbeat(projectPath: string): void {
  try {
    const registry = readRegistryFile()

    if (registry[projectPath]) {
      registry[projectPath].lastSeen = Date.now()
      writeRegistryFile(registry)
    } else {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    }
  } catch (error) {
    console.error('[MCP] Failed to update heartbeat:', error)
  }
}

export function registerDevServer(
  projectPath: string,
  port: number,
  hostname: string
): void {
  if (registrationComplete) {
    console.warn(
      '[MCP] Dev server already registered, skipping duplicate registration'
    )
    return
  }

  try {
    const normalizedPath = path.resolve(projectPath)
    const registry = readRegistryFile()
    const currentPid = process.pid

    if (registry[normalizedPath]) {
      const existing = registry[normalizedPath]

      if (existing.pid !== currentPid) {
        const isOtherServerAlive = isProcessAlive(existing.pid)

        if (isOtherServerAlive) {
          console.error(
            `\n[MCP] ERROR: Another dev server is already running for this project!\n` +
              `  Project: ${normalizedPath}\n` +
              `  Existing server: PID ${existing.pid} on ${existing.hostname}:${existing.port}\n` +
              `  This server: PID ${currentPid} on ${hostname}:${port}\n\n` +
              `Please stop the other dev server first, or use a different project directory.\n`
          )
          return
        } else {
          console.warn(
            `[MCP] Stale server entry found (PID ${existing.pid} is dead), replacing...`
          )
        }
      }
    }

    registry[normalizedPath] = {
      port,
      hostname,
      pid: currentPid,
      projectPath: normalizedPath,
      lastSeen: Date.now(),
    }

    if (!writeRegistryFile(registry)) {
      throw new Error('Failed to write registry file')
    }

    registrationComplete = true

    heartbeatInterval = setInterval(
      () => updateHeartbeat(normalizedPath),
      HEARTBEAT_INTERVAL_MS
    )

    const cleanup = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      unregisterDevServer(normalizedPath)
    }

    process.once('exit', cleanup)
    process.once('SIGINT', () => {
      cleanup()
      process.exit(130)
    })
    process.once('SIGTERM', () => {
      cleanup()
      process.exit(143)
    })

    console.log(
      `[MCP] Registered dev server: ${normalizedPath} on ${hostname}:${port}`
    )
  } catch (error) {
    console.error('[MCP] Failed to register dev server:', error)
    registrationComplete = false
  }
}

export function unregisterDevServer(projectPath: string): void {
  if (!registrationComplete) {
    return
  }

  try {
    const normalizedPath = path.resolve(projectPath)
    const registry = readRegistryFile()

    if (!registry[normalizedPath]) {
      return
    }

    delete registry[normalizedPath]

    writeRegistryFile(registry)

    console.log(`[MCP] Unregistered dev server: ${normalizedPath}`)
    registrationComplete = false
  } catch (error) {
    console.error('[MCP] Failed to unregister dev server:', error)
  }
}
