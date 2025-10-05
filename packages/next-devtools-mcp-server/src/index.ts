#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import { registerGetProjectPathTool } from './tools/get-project-path'
import { registerGetErrorsTool } from './tools/get-errors'
import { registerGetPageMetadataTool } from './tools/get-page-metadata'
import { registerGetLogsTool } from './tools/get-logs'
import { registerGetActionByIdTool } from './tools/get-server-action-by-id'

async function main() {
  const server = new McpServer({
    name: 'next-devtools-mcp-server',
    version: '0.1.0',
  })

  registerGetProjectPathTool(server)
  registerGetErrorsTool(server)
  registerGetPageMetadataTool(server)
  registerGetLogsTool(server)
  registerGetActionByIdTool(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('Next.js Devtools MCP server started')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
