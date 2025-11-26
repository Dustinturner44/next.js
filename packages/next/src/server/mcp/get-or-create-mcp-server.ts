import { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import { registerGetProjectMetadataTool } from './tools/get-project-metadata'
import { registerGetErrorsTool } from './tools/get-errors'
import { registerGetPageMetadataTool } from './tools/get-page-metadata'
import { registerGetLogsTool } from './tools/get-logs'
import { registerGetActionByIdTool } from './tools/get-server-action-by-id'
import { registerGetRoutesTool } from './tools/get-routes'
import { registerGetTurbopackEntrypointsTool } from './tools/get-turbopack-entrypoints'
import { registerQueryTurbopackIssuesTool } from './tools/query-turbopack-issues'
import { registerGetModuleGraphTool } from './tools/get-module-graph'
import { registerQueryModuleInEntryTool } from './tools/query-module-in-entry'
import type { HmrMessageSentToBrowser } from '../dev/hot-reloader-types'
import type { NextConfigComplete } from '../config-shared'
import type { Project, Entrypoints } from '../../build/swc/types'
import type { EntryIssuesMap } from '../../shared/lib/turbopack/utils'

export interface McpServerOptions {
  projectPath: string
  distDir: string
  nextConfig: NextConfigComplete
  pagesDir: string | undefined
  appDir: string | undefined
  sendHmrMessage: (message: HmrMessageSentToBrowser) => void
  getActiveConnectionCount: () => number
  getDevServerUrl: () => string | undefined
  // Turbopack-specific options (optional, only available when using Turbopack)
  getTurbopackProject?: () => Project | undefined
  getCurrentEntrypoints?: () => Entrypoints | undefined
  getCurrentIssues?: () => EntryIssuesMap
}

let mcpServer: McpServer | undefined

export const getOrCreateMcpServer = (options: McpServerOptions) => {
  if (mcpServer) {
    return mcpServer
  }

  mcpServer = new McpServer({
    name: 'Next.js MCP Server',
    version: '0.2.0',
  })

  registerGetProjectMetadataTool(
    mcpServer,
    options.projectPath,
    options.getDevServerUrl
  )
  registerGetErrorsTool(
    mcpServer,
    options.sendHmrMessage,
    options.getActiveConnectionCount
  )
  registerGetPageMetadataTool(
    mcpServer,
    options.sendHmrMessage,
    options.getActiveConnectionCount
  )
  registerGetLogsTool(mcpServer, options.distDir)
  registerGetActionByIdTool(mcpServer, options.distDir)
  registerGetRoutesTool(mcpServer, {
    projectPath: options.projectPath,
    nextConfig: options.nextConfig,
    pagesDir: options.pagesDir,
    appDir: options.appDir,
  })

  // Register Turbopack-specific tools if the callbacks are provided
  if (options.getTurbopackProject && options.getCurrentEntrypoints) {
    registerGetTurbopackEntrypointsTool(
      mcpServer,
      options.getTurbopackProject,
      options.getCurrentEntrypoints
    )

    registerGetModuleGraphTool(
      mcpServer,
      options.getTurbopackProject,
      options.getCurrentEntrypoints
    )

    registerQueryModuleInEntryTool(
      mcpServer,
      options.getTurbopackProject,
      options.getCurrentEntrypoints
    )
  }

  if (options.getTurbopackProject && options.getCurrentIssues) {
    registerQueryTurbopackIssuesTool(
      mcpServer,
      options.getTurbopackProject,
      options.getCurrentIssues
    )
  }

  return mcpServer
}
