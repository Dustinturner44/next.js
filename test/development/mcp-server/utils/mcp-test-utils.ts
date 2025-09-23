export async function initializeMCPSession(
  mcpEndpoint: string,
  id: string
): Promise<any> {
  const initResponse = await fetch(mcpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '1.0.0',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    }),
  })

  const initText = await initResponse.text()
  const dataMatch = initText.match(/data: ({.*})/s)
  if (!dataMatch) {
    throw new Error(`Unexpected response format: ${initText}`)
  }

  const initResult = JSON.parse(dataMatch[1])
  if (initResult.error) {
    throw new Error(`MCP error: ${JSON.stringify(initResult.error)}`)
  }

  return initResult
}
