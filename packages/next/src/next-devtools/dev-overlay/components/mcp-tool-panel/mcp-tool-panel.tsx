import React, { useState } from 'react'
import { css } from '../../utils/css'

const styles = css`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

interface MCPToolPanelProps {
  toolName: string
  tool?: any
}

export const MCPToolPanel: React.FC<MCPToolPanelProps> = ({ toolName, tool }) => {
  const [executionArgs, setExecutionArgs] = useState<string>('{}')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)

  const toggleToolEnabled = async () => {
    try {
      const response = await fetch('http://localhost:8001/toggle-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          isDisabled: !tool?.isDisabled,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle tool')
      }
    } catch (error) {
      console.error('Failed to toggle tool:', error)
    }
  }

  const executeTool = async () => {
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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('http://localhost:8001/execute-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          args: args,
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        setExecutionResult({
          success: false,
          error: errorText || 'Failed to execute tool',
        })
        return
      }

      const data = await response.json()
      setExecutionResult({
        success: true,
        result: data.result,
      })
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setExecuting(false)
    }
  }

  if (!tool) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}>
        Tool not found
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Tool Info Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--color-gray-alpha-400)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            {tool.name}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Online Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: tool.online ? 'var(--color-green-alpha-200)' : 'var(--color-gray-alpha-200)',
              fontSize: '12px',
              fontWeight: 500,
              color: tool.online ? 'var(--color-green-800)' : 'var(--color-gray-700)',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: tool.online ? 'var(--color-green-700)' : 'var(--color-gray-500)',
              }} />
              {tool.online ? 'Online' : 'Offline'}
            </div>
            
            {/* Enable/Disable Toggle - Only show when online */}
            {tool.online && (
              <button
                onClick={toggleToolEnabled}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-gray-alpha-400)',
                  backgroundColor: tool.isDisabled ? 'var(--color-gray-alpha-100)' : 'var(--color-green-alpha-100)',
                  color: tool.isDisabled ? 'var(--color-gray-700)' : 'var(--color-green-800)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tool.isDisabled ? 'Enable' : 'Enabled'}
              </button>
            )}
            
            {/* Delete Tool Button */}
            <button
              onClick={async () => {
                const confirmed = confirm(`Are you sure you want to delete the tool "${tool.name}"?`)
                if (confirmed) {
                  try {
                    const response = await fetch('http://localhost:8001/delete-tool', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ toolName }),
                    })
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete tool')
                    }
                    
                    // Close the panel after successful deletion
                    window.dispatchEvent(new CustomEvent('close-mcp-panel', { detail: { toolName } }))
                  } catch (error) {
                    console.error('Failed to delete tool:', error)
                    // Show error in execution result instead of alert
                    setExecutionResult({
                      success: false,
                      error: 'Failed to delete tool. Please try again.',
                    })
                  }
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-red-alpha-400)',
                backgroundColor: 'var(--color-red-alpha-100)',
                color: 'var(--color-red-700)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-red-alpha-200)'
                e.currentTarget.style.borderColor = 'var(--color-red-alpha-600)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-red-alpha-100)'
                e.currentTarget.style.borderColor = 'var(--color-red-alpha-400)'
              }}
            >
              Delete
            </button>
          </div>
        </div>
        
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}>
          {tool.description}
        </p>
        
        {tool.projectId && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
          }}>
            Project: {tool.projectId}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
      }}>
        {/* Arguments and Execute */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          marginBottom: '20px',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}>
              Arguments
            </label>
            <textarea
              value={executionArgs}
              onChange={(e) => setExecutionArgs(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                minHeight: '36px',
                padding: '8px 10px',
                border: '1px solid var(--color-gray-alpha-400)',
                borderRadius: '6px',
                backgroundColor: 'var(--color-background-100)',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                lineHeight: '1.5',
              }}
              placeholder="{}"
              disabled={!tool.online || tool.isDisabled}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gray-alpha-600)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gray-alpha-400)'
              }}
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={executeTool}
            disabled={executing || !tool.online || tool.isDisabled}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-gray-alpha-400)',
              backgroundColor: executing || !tool.online || tool.isDisabled
                ? 'var(--color-gray-alpha-100)'
                : 'var(--color-gray-alpha-100)',
              color: executing || !tool.online || tool.isDisabled
                ? 'var(--color-gray-600)'
                : 'var(--color-text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: executing || !tool.online || tool.isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!executing && tool.online && !tool.isDisabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-gray-alpha-200)'
                e.currentTarget.style.borderColor = 'var(--color-gray-alpha-600)'
              }
            }}
            onMouseLeave={(e) => {
              if (!executing && tool.online && !tool.isDisabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-gray-alpha-100)'
                e.currentTarget.style.borderColor = 'var(--color-gray-alpha-400)'
              }
            }}
          >
            {executing && (
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid var(--color-gray-alpha-400)',
                borderTopColor: 'var(--color-gray-900)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
            {executing ? 'Running...' : 'Execute'}
          </button>
        </div>

        {/* Collapsible Schema */}
        {tool.inputSchema && (
          <details style={{ marginBottom: '20px' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
              marginBottom: '8px',
              userSelect: 'none',
            }}>
              View Schema
            </summary>
            <pre style={{
              margin: 0,
              padding: '10px',
              backgroundColor: 'var(--color-gray-alpha-100)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '120px',
              border: '1px solid var(--color-gray-alpha-200)',
              color: 'var(--color-text-secondary)',
            }}>
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </details>
        )}

        {/* Result Section */}
        {executionResult && (
          <div style={{
            borderRadius: '6px',
            border: `1px solid ${executionResult.success 
              ? 'var(--color-green-alpha-400)' 
              : 'var(--color-red-alpha-400)'}`,
            backgroundColor: executionResult.success 
              ? 'var(--color-green-alpha-100)' 
              : 'var(--color-red-alpha-100)',
            padding: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: executionResult.success
                  ? 'var(--color-green-800)'
                  : 'var(--color-red-800)',
              }}>
                {executionResult.success ? '✓ Success' : '✗ Error'}
              </span>
            </div>
            <pre style={{
              margin: 0,
              padding: 0,
              fontSize: '11px',
              fontFamily: 'monospace',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              color: executionResult.success
                ? 'var(--color-green-900)'
                : 'var(--color-red-900)',
              backgroundColor: 'transparent',
            }}>
              {executionResult.success
                ? typeof executionResult.result === 'string'
                  ? executionResult.result
                  : JSON.stringify(executionResult.result, null, 2)
                : executionResult.error}
            </pre>
          </div>
        )}
      </div>
      <style>{styles}</style>
    </div>
  )
}