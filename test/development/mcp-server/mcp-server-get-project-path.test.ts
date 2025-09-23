import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { initializeMCPSession } from './utils/mcp-test-utils'

describe('mcp-server get_project_path tool', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'default-template')),
  })

  it('should list get_project_path tool in available tools', async () => {
    const mcpEndpoint = `${next.url}/_next/mcp`

    // Initialize MCP session
    await initializeMCPSession(mcpEndpoint, 'init-1')

    // List available tools
    const listToolsResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'list-tools-1',
        method: 'tools/list',
        params: {},
      }),
    })

    const listToolsText = await listToolsResponse.text()
    const listToolsDataMatch = listToolsText.match(/data: ({.*})/s)
    expect(listToolsDataMatch).toBeTruthy()

    const listToolsResult = JSON.parse(listToolsDataMatch![1])
    expect(listToolsResult.result?.tools).toBeInstanceOf(Array)

    const projectDirTool = listToolsResult.result?.tools?.find(
      (tool: { name: string }) => tool.name === 'get_project_path'
    )

    expect(projectDirTool).toBeDefined()
    expect(projectDirTool?.description).toBe(
      'Returns the absolute path of the root directory for this Next.js project.'
    )

    // Input schema should be an empty object schema
    expect(projectDirTool?.inputSchema).toMatchObject({
      type: 'object',
      properties: {},
    })
  })

  it('should return correct project path via get_project_path tool', async () => {
    const mcpEndpoint = `${next.url}/_next/mcp`

    // Initialize MCP session
    await initializeMCPSession(mcpEndpoint, 'init-2')

    // Call get_project_path tool
    const callToolResponse = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-tool-1',
        method: 'tools/call',
        params: {
          name: 'get_project_path',
          arguments: {},
        },
      }),
    })

    const callToolText = await callToolResponse.text()
    const callToolDataMatch = callToolText.match(/data: ({.*})/s)
    expect(callToolDataMatch).toBeTruthy()

    const callToolResult = JSON.parse(callToolDataMatch![1])
    expect(callToolResult.jsonrpc).toBe('2.0')
    expect(callToolResult.id).toBe('call-tool-1')

    const content = callToolResult.result?.content
    expect(content).toBeInstanceOf(Array)
    expect(content?.[0]?.type).toBe('text')

    const actualProjectPath = content?.[0]?.text

    // Verify it's an absolute path
    expect(path.isAbsolute(actualProjectPath)).toBe(true)

    // Should match the test directory
    expect(actualProjectPath).toBe(next.testDir)
  })
})
