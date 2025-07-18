import React, { useState } from 'react'
import { css } from '../../utils/css'

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
        {/* Input Schema */}
        {tool.inputSchema && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}>
              Input Schema
            </h3>
            <pre style={{
              margin: 0,
              padding: '16px',
              backgroundColor: 'var(--color-gray-alpha-100)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '200px',
              border: '1px solid var(--color-gray-alpha-200)',
            }}>
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </div>
        )}

        {/* Arguments Input */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}>
            Arguments
          </h3>
          <textarea
            value={executionArgs}
            onChange={(e) => setExecutionArgs(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '16px',
              border: '1px solid var(--color-gray-alpha-400)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background-100)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
            placeholder="{}"
            disabled={!tool.online || tool.isDisabled}
          />
        </div>

        {/* Execute Button */}
        <button
          onClick={executeTool}
          disabled={executing || !tool.online || tool.isDisabled}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: executing || !tool.online || tool.isDisabled
              ? 'var(--color-gray-alpha-400)'
              : 'var(--color-blue-700)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: executing || !tool.online || tool.isDisabled ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s',
          }}
        >
          {executing ? 'Executing...' : 'Execute Tool'}
        </button>

        {/* Execution Result */}
        {executionResult && (
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: executionResult.success
                ? 'var(--color-green-700)'
                : 'var(--color-red-700)',
            }}>
              {executionResult.success ? 'Result' : 'Error'}
            </h3>
            <pre style={{
              margin: 0,
              padding: '16px',
              backgroundColor: executionResult.success
                ? 'var(--color-green-alpha-100)'
                : 'var(--color-red-alpha-100)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: `1px solid ${executionResult.success 
                ? 'var(--color-green-alpha-300)' 
                : 'var(--color-red-alpha-300)'}`,
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
    </div>
  )
}