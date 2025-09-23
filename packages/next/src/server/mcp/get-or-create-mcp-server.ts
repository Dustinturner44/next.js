import { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import { registerGetProjectPathTool } from './tools/get-project-path'
import { registerResolveStackFramesTool } from './tools/resolve-stack-frames'

let mcpServer: McpServer | undefined

export const getOrCreateMcpServer = (projectPath: string) => {
  if (mcpServer) {
    return mcpServer
  }

  mcpServer = new McpServer({
    name: 'Next.js MCP Server',
    version: '0.1.0',
  })

  registerGetProjectPathTool(mcpServer, projectPath)
  registerResolveStackFramesTool(mcpServer)

  return mcpServer
}
