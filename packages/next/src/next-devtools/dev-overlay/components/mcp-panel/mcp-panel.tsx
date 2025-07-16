import React, { useState, useEffect } from 'react'
import { css } from '../../utils/css'

interface Tool {
  name: string
  description: string
  inputSchema?: any
  projectId?: string
  online?: boolean
}

interface ToolStatus {
  name: string
  projectId: string
  online: boolean
  lastSeen: string
}

interface ExecutionResult {
  success: boolean
  result?: any
  error?: string
}

export const MCPPanel = () => {
  const [tools, setTools] = useState<Tool[]>([])
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolStatus>>({})
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [executionArgs, setExecutionArgs] = useState<string>('{}')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [connected, setConnected] = useState(false)

  // Check connection status
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:8001/debug')
      if (response.ok) {
        setConnected(true)
      } else {
        setConnected(false)
      }
    } catch {
      setConnected(false)
    }
  }

  // Fetch tools from WebSocket singleton
  const fetchTools = async () => {
    try {
      setLoading(true)
      
      // Get tools with status from WebSocket singleton
      const wsResponse = await fetch('http://localhost:8001/tools')
      
      if (!wsResponse.ok) {
        setConnected(false)
        setTools([])
        return
      }
      
      setConnected(true)
      const wsData = await wsResponse.json()
      
      if (wsData.tools && wsData.tools.length > 0) {
        // Use the tools directly from WebSocket singleton
        // They already have all the information we need
        const toolsWithStatus = wsData.tools.map((tool: any) => ({
          ...tool,
          online: tool.online || false,
          projectId: tool.projectId || tool.name.split('_')[0],
        }))
        
        setTools(toolsWithStatus)
      } else {
        setTools([])
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error)
      setConnected(false)
      setTools([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch with small delay to let hidden panels establish connections
    const initialTimeout = setTimeout(() => {
      fetchTools()
    }, 500)
    
    // Check connection and fetch tools every 1 second
    const interval = setInterval(() => {
      checkConnection()
      fetchTools()
    }, 1000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const executeTool = async (tool: Tool) => {
    try {
      setExecuting(true)
      setExecutionResult(null)

      // Parse arguments
      let args = {}
      try {
        args = JSON.parse(executionArgs)
      } catch (e) {
        setExecutionResult({
          success: false,
          error: 'Invalid JSON arguments',
        })
        return
      }

      // Execute directly through WebSocket server's debug endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('http://localhost:8001/execute-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: tool.name,
          args: args,
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        try {
          const errorData = await response.json()
          setExecutionResult({
            success: false,
            error: errorData.error || 'Failed to execute tool',
          })
        } catch {
          const errorText = await response.text()
          setExecutionResult({
            success: false,
            error: errorText || 'Failed to execute tool',
          })
        }
        return
      }

      const data = await response.json()
      
      if (data.error) {
        setExecutionResult({
          success: false,
          error: data.error,
        })
      } else {
        setExecutionResult({
          success: true,
          result: data.result,
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setExecutionResult({
          success: false,
          error: 'Tool execution timed out after 30 seconds',
        })
      } else {
        setExecutionResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } finally {
      setExecuting(false)
    }
  }

  // Group tools by project
  const toolsByProject = tools.reduce((acc, tool) => {
    const projectId = tool.name.split('_')[0] || 'unknown'
    if (!acc[projectId]) acc[projectId] = []
    acc[projectId].push(tool)
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <>
      <div
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Tool List */}
        <div
          style={{
            width: '40%',
            borderRight: '1px solid var(--color-gray-alpha-400)',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-gray-alpha-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-background-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Available Tools ({tools.length})
              </h3>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connected ? 'var(--color-green-700)' : 'var(--color-red-700)',
                  boxShadow: connected ? '0 0 0 1px var(--color-green-200)' : '0 0 0 1px var(--color-red-200)',
                }}
                title={connected ? 'Connected to WebSocket' : 'Disconnected'}
              />
            </div>
            <button
              onClick={fetchTools}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-gray-alpha-400)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && tools.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              Loading tools...
            </div>
          ) : tools.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              No tools available
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {Object.entries(toolsByProject).map(([projectId, projectTools]) => (
                <div key={projectId} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                      padding: '0 8px',
                    }}
                  >
                    {projectId}
                  </div>
                  {projectTools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => {
                        setSelectedTool(tool)
                        setExecutionArgs('{}')
                        setExecutionResult(null)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        border: '1px solid var(--color-gray-alpha-400)',
                        borderRadius: '6px',
                        background:
                          selectedTool?.name === tool.name
                            ? 'var(--color-gray-alpha-200)'
                            : 'var(--color-background-100)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTool?.name !== tool.name) {
                          e.currentTarget.style.background = 'var(--color-gray-alpha-100)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTool?.name !== tool.name) {
                          e.currentTarget.style.background = 'var(--color-background-100)'
                        }
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--color-gray-1000)',
                          marginBottom: '4px',
                        }}
                      >
                        {tool.name.split('_').slice(1).join('_')}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-gray-700)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tool.description}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tool Details */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedTool ? (
            <>
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--color-gray-alpha-400)',
                  backgroundColor: 'var(--color-background-200)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  {selectedTool.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {selectedTool.description}
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflow: 'auto',
                }}
              >
                {/* Input Schema */}
                {selectedTool.inputSchema && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Input Schema
                    </h4>
                    <pre
                      style={{
                        margin: 0,
                        padding: '12px',
                        backgroundColor: 'var(--color-gray-alpha-100)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        maxHeight: '150px',
                      }}
                    >
                      {JSON.stringify(selectedTool.inputSchema, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Arguments Input */}
                <div style={{ marginBottom: '20px' }}>
                  <h4
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Arguments
                  </h4>
                  <textarea
                    value={executionArgs}
                    onChange={(e) => setExecutionArgs(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '12px',
                      border: '1px solid var(--color-gray-alpha-400)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-background-100)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                    }}
                    placeholder="{}"
                  />
                </div>

                {/* Execute Button */}
                <button
                  onClick={() => executeTool(selectedTool)}
                  disabled={executing}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: executing
                      ? 'var(--color-gray-alpha-400)'
                      : 'var(--color-blue-700)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: executing ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                  }}
                >
                  {executing ? 'Executing...' : 'Execute Tool'}
                </button>

                {/* Execution Result */}
                {executionResult && (
                  <div>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: executionResult.success
                          ? 'var(--color-green-700)'
                          : 'var(--color-red-700)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {executionResult.success ? 'Result' : 'Error'}
                    </h4>
                    <pre
                      style={{
                        margin: 0,
                        padding: '12px',
                        backgroundColor: executionResult.success
                          ? 'var(--color-green-alpha-100)'
                          : 'var(--color-red-alpha-100)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {executionResult.success
                        ? typeof executionResult.result === 'string'
                          ? executionResult.result
                          : JSON.stringify(executionResult.result, null, 2)
                        : executionResult.error}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}
            >
              Select a tool to view details and execute
            </div>
          )}
        </div>
      </div>

      <style>{css`
        /* Custom scrollbar for MCP panel */
        #mcp-panel ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        #mcp-panel ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        #mcp-panel ::-webkit-scrollbar-thumb {
          background: var(--color-gray-alpha-400);
          border-radius: 4px;
        }
        
        #mcp-panel ::-webkit-scrollbar-thumb:hover {
          background: var(--color-gray-alpha-600);
        }
      `}</style>
    </>
  )
}