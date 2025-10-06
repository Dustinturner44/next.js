#!/usr/bin/env node

import { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/stdio'
import { z } from 'next/dist/compiled/zod'
import fs from 'fs'
import path from 'path'
import os from 'os'

const DEV_SERVER_REGISTRY_PATH = path.join(os.tmpdir(), 'next-dev-servers.json')

const HEARTBEAT_TIMEOUT_MS = 60000
const REGISTRY_POLL_INTERVAL_MS = 2000

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

let devServerRegistry: DevServerRegistry = {}
let registryWatcher: fs.FSWatcher | null = null
let cleanupRegistryInterval: NodeJS.Timeout | null = null

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return false
  }
}

function loadDevServerRegistry(): DevServerRegistry {
  try {
    if (!fs.existsSync(DEV_SERVER_REGISTRY_PATH)) {
      return {}
    }

    const content = fs.readFileSync(DEV_SERVER_REGISTRY_PATH, 'utf-8')
    if (!content.trim()) {
      return {}
    }

    const registry = JSON.parse(content) as DevServerRegistry
    const now = Date.now()
    const cleanedRegistry: DevServerRegistry = {}

    for (const [projectPath, info] of Object.entries(registry)) {
      if (
        typeof info.port !== 'number' ||
        typeof info.hostname !== 'string' ||
        typeof info.pid !== 'number' ||
        typeof info.projectPath !== 'string' ||
        typeof info.lastSeen !== 'number'
      ) {
        console.error(
          `[MCP] Invalid registry entry for ${projectPath}, skipping`
        )
        continue
      }

      if (now - info.lastSeen > HEARTBEAT_TIMEOUT_MS) {
        console.error(
          `[MCP] Dev server at ${projectPath} is stale (last seen ${Math.round((now - info.lastSeen) / 1000)}s ago), removing`
        )
        continue
      }

      if (!isProcessAlive(info.pid)) {
        console.error(
          `[MCP] Dev server at ${projectPath} (PID ${info.pid}) is not running, removing`
        )
        continue
      }

      cleanedRegistry[projectPath] = info
    }

    return cleanedRegistry
  } catch (error) {
    console.error('[MCP] Failed to load dev server registry:', error)
    return {}
  }
}

function watchDevServerRegistry(
  onChange: (registry: DevServerRegistry) => void
): () => void {
  const dir = path.dirname(DEV_SERVER_REGISTRY_PATH)

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch (error) {
    console.error('[MCP] Failed to create registry directory:', error)
    return () => {}
  }

  try {
    registryWatcher = fs.watch(
      dir,
      { persistent: false },
      (eventType, filename) => {
        if (filename === path.basename(DEV_SERVER_REGISTRY_PATH)) {
          try {
            const registry = loadDevServerRegistry()
            onChange(registry)
          } catch (error) {
            console.error('[MCP] Error handling registry change:', error)
          }
        }
      }
    )

    registryWatcher.on('error', (error) => {
      console.error('[MCP] Registry watcher error:', error)
    })

    cleanupRegistryInterval = setInterval(() => {
      try {
        const registry = loadDevServerRegistry()
        onChange(registry)
      } catch (error) {
        console.error('[MCP] Error during periodic registry cleanup:', error)
      }
    }, REGISTRY_POLL_INTERVAL_MS)

    return () => {
      if (registryWatcher) {
        registryWatcher.close()
        registryWatcher = null
      }
      if (cleanupRegistryInterval) {
        clearInterval(cleanupRegistryInterval)
        cleanupRegistryInterval = null
      }
    }
  } catch (error) {
    console.error('[MCP] Failed to setup registry watcher:', error)
    return () => {}
  }
}

function findDevServerByContext(context?: string): DevServerInfo | null {
  const servers = Object.values(devServerRegistry)

  if (servers.length === 0) {
    return null
  }

  if (servers.length === 1) {
    return servers[0]
  }

  if (!context) {
    return null
  }

  if (devServerRegistry[context]) {
    return devServerRegistry[context]
  }

  const normalizedContext = path.normalize(context)

  for (const server of servers) {
    if (server.projectPath === normalizedContext) {
      return server
    }
  }

  for (const server of servers) {
    if (server.projectPath.includes(normalizedContext)) {
      return server
    }
  }

  for (const server of servers) {
    if (normalizedContext.includes(path.basename(server.projectPath))) {
      return server
    }
  }

  return null
}

async function proxyMcpRequest(
  method: string,
  params: unknown,
  context?: string,
  toolName?: string
): Promise<any> {
  const devServer = findDevServerByContext(context)

  if (!devServer) {
    const projectCount = Object.keys(devServerRegistry).length
    if (projectCount === 0) {
      throw new Error(
        'No dev servers running. Please start a dev server with `next dev`'
      )
    } else if (context) {
      const availableProjects = Object.keys(devServerRegistry)
        .map((p) => `  - ${p}`)
        .join('\n')
      throw new Error(
        `Could not find dev server for context "${context}".\n` +
          `Available projects:\n${availableProjects}\n\n` +
          `Use get_project_path() with one of the paths above.`
      )
    } else {
      const availableProjects = Object.keys(devServerRegistry)
        .map((p) => `  - ${p}`)
        .join('\n')
      throw new Error(
        `Multiple dev servers running (${projectCount}). Please specify projectPath.\n` +
          `Available projects:\n${availableProjects}\n\n` +
          `Example: get_errors({ projectPath: "${Object.keys(devServerRegistry)[0]}" })`
      )
    }
  }

  const url = `http://${devServer.hostname}:${devServer.port}/_next/mcp`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(
        `Request to dev server timed out (${devServer.projectPath}). ` +
          `The dev server may be unresponsive.`
      )
    }
    throw new Error(
      `Failed to connect to dev server at ${devServer.hostname}:${devServer.port} (${devServer.projectPath}). ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  if (!response.ok) {
    throw new Error(
      `Dev server returned HTTP ${response.status}: ${response.statusText} (${devServer.projectPath})`
    )
  }

  let data: {
    error?: { code?: number; message?: string }
    result?: unknown
  }

  try {
    data = await response.json()
  } catch (error) {
    throw new Error(
      `Invalid JSON response from dev server (${devServer.projectPath})`
    )
  }

  if (data.error) {
    if (
      toolName &&
      data.error.message &&
      (data.error.message.toLowerCase().includes('unknown tool') ||
        data.error.message.toLowerCase().includes('not found'))
    ) {
      throw new Error(
        `Tool '${toolName}' is not supported in this project (${devServer.projectPath}).\n\n` +
          `This tool may require a newer version of Next.js.\n` +
          `Try upgrading: npm install next@latest`
      )
    }
    throw new Error(
      data.error.message || `MCP error code ${data.error.code || 'unknown'}`
    )
  }

  return data.result
}

async function startStdioMcpServer(): Promise<void> {
  devServerRegistry = loadDevServerRegistry()

  const cleanup = watchDevServerRegistry((registry) => {
    devServerRegistry = registry
    const serverCount = Object.keys(registry).length
    console.error(`[MCP] Registry updated: ${serverCount} dev server(s) active`)
    for (const [projectPath, info] of Object.entries(registry)) {
      console.error(`[MCP]   - ${projectPath} on ${info.hostname}:${info.port}`)
    }
  })

  process.on('SIGINT', () => {
    console.error('[MCP] Received SIGINT, shutting down...')
    cleanup()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.error('[MCP] Received SIGTERM, shutting down...')
    cleanup()
    process.exit(0)
  })

  process.on('uncaughtException', (error) => {
    console.error('[MCP] Uncaught exception:', error)
    cleanup()
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    console.error('[MCP] Unhandled rejection:', reason)
    cleanup()
    process.exit(1)
  })

  const mcpServer = new McpServer({
    name: 'Next.js Dev Server Manager (stdio)',
    version: '0.1.0',
  })

  mcpServer.registerTool(
    'list_dev_servers',
    {
      description: 'List all running Next.js dev servers',
      inputSchema: {},
    },
    async () => {
      const servers = Object.entries(devServerRegistry).map(
        ([projectPath, info]) => ({
          projectPath,
          port: info.port,
          hostname: info.hostname,
          pid: info.pid,
        })
      )
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ servers }, null, 2),
          },
        ],
      }
    }
  )

  mcpServer.registerTool(
    'get_project_path',
    {
      description:
        'Get the absolute path to the Next.js project directory. Optional projectPath context to specify which dev server.',
      inputSchema: {
        projectPath: z.string().optional(),
      },
    },
    async (request) => {
      return proxyMcpRequest(
        'tools/call',
        {
          name: 'get_project_path',
          arguments: {},
        },
        request.projectPath,
        'get_project_path'
      )
    }
  )

  mcpServer.registerTool(
    'get_errors',
    {
      description:
        'Get the current error state of the app when rendered in the browser. Optional projectPath to specify which dev server.',
      inputSchema: {
        projectPath: z.string().optional(),
      },
    },
    async (request) => {
      return proxyMcpRequest(
        'tools/call',
        {
          name: 'get_errors',
          arguments: {},
        },
        request.projectPath,
        'get_errors'
      )
    }
  )

  mcpServer.registerTool(
    'get_page_metadata',
    {
      description:
        'Get metadata about the currently loaded page in the browser. Optional projectPath to specify which dev server.',
      inputSchema: {
        projectPath: z.string().optional(),
      },
    },
    async (request) => {
      return proxyMcpRequest(
        'tools/call',
        {
          name: 'get_page_metadata',
          arguments: {},
        },
        request.projectPath,
        'get_page_metadata'
      )
    }
  )

  mcpServer.registerTool(
    'get_logs',
    {
      description:
        'Get recent build and runtime logs from the dev server. Optional projectPath to specify which dev server.',
      inputSchema: {
        projectPath: z.string().optional(),
      },
    },
    async (request) => {
      return proxyMcpRequest(
        'tools/call',
        {
          name: 'get_logs',
          arguments: {},
        },
        request.projectPath,
        'get_logs'
      )
    }
  )

  mcpServer.registerTool(
    'get_server_action_by_id',
    {
      description:
        'Get information about a specific server action by its ID. Optional projectPath to specify which dev server.',
      inputSchema: {
        actionId: z.string(),
        projectPath: z.string().optional(),
      },
    },
    async (request) => {
      return proxyMcpRequest(
        'tools/call',
        {
          name: 'get_server_action_by_id',
          arguments: { actionId: request.actionId },
        },
        request.projectPath,
        'get_server_action_by_id'
      )
    }
  )

  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)

  const serverCount = Object.keys(devServerRegistry).length
  console.error('[MCP] Session manager started')
  console.error('[MCP] Managing all Next.js dev servers on this machine')
  console.error(`[MCP] Currently tracking ${serverCount} dev server(s)`)

  if (serverCount === 0) {
    console.error('[MCP] Waiting for dev servers to start...')
    console.error('[MCP] Run `next dev` in a Next.js project to register it')
  }
}

startStdioMcpServer().catch((error) => {
  console.error('[MCP] Fatal error:', error)
  console.error('[MCP] Stack:', error instanceof Error ? error.stack : error)
  process.exit(1)
})
