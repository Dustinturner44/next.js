import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export interface NextMcpOptions {
  port?: number
  url?: string
}

export async function nextMcp(options: NextMcpOptions): Promise<void> {
  const mcpUrl =
    options.url || `http://localhost:${options.port || 3000}/_next/mcp`

  console.error(`[Next.js MCP Proxy] Starting proxy to ${mcpUrl}`)
  console.error(
    '[Next.js MCP Proxy] This bridges Claude Desktop (stdio) to Next.js MCP server (HTTP)'
  )
  console.error('')
  console.error('Add this to your claude_desktop_config.json:')
  console.error(
    JSON.stringify(
      {
        mcpServers: {
          nextjs: {
            command: 'npx next',
            args: ['mcp', '--port', String(options.port || 3000)],
          },
        },
      },
      null,
      2
    )
  )
  console.error('')

  // Create MCP server that acts as a proxy
  const server = new McpServer({
    name: 'Next.js MCP Proxy',
    version: '1.0.0',
    description: 'Proxy between Claude Desktop and Next.js MCP server',
  })

  // Forward all tool calls to the HTTP MCP server
  let availableTools: any[] = []

  // Fetch available tools from Next.js MCP server
  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    })

    if (response.ok) {
      let data
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const text = await response.text()
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6)
            if (jsonStr.trim()) {
              data = JSON.parse(jsonStr)
              break
            }
          }
        }
      } else {
        data = await response.json()
      }
      availableTools = data?.result?.tools || []
      console.error(
        `[Next.js MCP Proxy] Found ${availableTools.length} tools from Next.js MCP server`
      )
    } else {
      console.error(
        `[Next.js MCP Proxy] Warning: Could not fetch tools from ${mcpUrl} (${response.status})`
      )
      console.error(
        '[Next.js MCP Proxy] Make sure Next.js dev server is running with MCP enabled'
      )
    }
  } catch (error) {
    console.error(`[Next.js MCP Proxy] Warning: Could not connect to ${mcpUrl}`)
    console.error(
      '[Next.js MCP Proxy] Make sure Next.js dev server is running with MCP enabled'
    )
    console.error(`[Next.js MCP Proxy] Error: ${error}`)
  }

  // Register each tool as a proxy
  for (const tool of availableTools) {
    server.registerTool(tool.name, tool.inputSchema, async (request) => {
      try {
        const response = await fetch(mcpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: tool.name,
              arguments: request.params?.arguments || request.arguments || {},
            },
            id: Date.now(),
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        let data
        if (
          response.headers.get('content-type')?.includes('text/event-stream')
        ) {
          const text = await response.text()
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6)
              if (jsonStr.trim()) {
                data = JSON.parse(jsonStr)
                break
              }
            }
          }
        } else {
          data = await response.json()
        }

        if (data?.error) {
          throw new Error(data.error.message || 'Tool call failed')
        }

        return (
          data?.result || {
            content: [
              {
                type: 'text',
                text: `Tool "${tool.name}" executed successfully`,
              },
            ],
          }
        )
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calling tool "${tool.name}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    })
  }

  // Add a test connection tool
  server.registerTool(
    'test_nextjs_connection',
    {
      description: 'Test connection to Next.js MCP server',
      inputSchema: {},
    },
    async () => {
      try {
        const response = await fetch(mcpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            id: 1,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        let data
        if (
          response.headers.get('content-type')?.includes('text/event-stream')
        ) {
          const text = await response.text()
          const lines = text.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6)
              if (jsonStr.trim()) {
                data = JSON.parse(jsonStr)
                break
              }
            }
          }
        } else {
          data = await response.json()
        }
        return {
          content: [
            {
              type: 'text',
              text: `✅ Connected to Next.js MCP server successfully!\n\nAvailable tools: ${JSON.stringify(data?.result?.tools?.map((t: any) => t.name) || [], null, 2)}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to connect to Next.js MCP server at ${mcpUrl}\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nMake sure:\n1. Next.js dev server is running\n2. MCP middleware is enabled\n3. Server is accessible at ${mcpUrl}`,
            },
          ],
        }
      }
    }
  )

  // Create stdio transport for Claude Desktop
  const transport = new StdioServerTransport()

  console.error(
    '[Next.js MCP Proxy] Ready to handle requests from Claude Desktop'
  )

  // Handle cleanup
  const cleanup = () => {
    console.error('[Next.js MCP Proxy] Shutting down...')
    server.close()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('uncaughtException', (error) => {
    console.error('[Next.js MCP Proxy] Uncaught exception:', error)
    cleanup()
  })

  // Start the proxy
  await server.connect(transport)
}
