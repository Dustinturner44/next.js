import React, { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { DevToolsInfo, type DevToolsInfoPropsCore } from './dev-tools-info'

interface ServerActionLogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  args: any[]
  timestamp: number
  source: 'server-action' | 'server' | 'edge-server'
  id: string
}

export function ServerActionsInfo(
  props: DevToolsInfoPropsCore & React.HTMLProps<HTMLDivElement>
) {
  const { isOpen, close, triggerRef, ...otherProps } = props
  const [logs, setLogs] = useState<ServerActionLogEntry[]>([])
  const [newLogId, setNewLogId] = useState<string | null>(null)

  // Store logs in a global handler that can be accessed by HMR
  useEffect(() => {
    const handleServerLog = (logEntry: ServerActionLogEntry) => {
      setLogs(prev => [logEntry, ...prev.slice(0, 2)]) // Keep only 3 logs, new ones at top
      setNewLogId(logEntry.id) // Mark this log as new
      
      // Remove the new marker after animation completes
      setTimeout(() => {
        setNewLogId(null)
      }, 500)
    }

    // Register global handler for server logs
    ;(window as any).__NEXT_SERVER_ACTIONS_LOG_HANDLER = handleServerLog

    return () => {
      ;(window as any).__NEXT_SERVER_ACTIONS_LOG_HANDLER = null
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
    setNewLogId(null)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatServerAction = (args: any[]) => {
    if (args.length < 4) {
      // Fallback for unexpected format
      return args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    }

    // Expected format: ['[SERVER ACTION]', 'functionName(', arguments, ')']
    const functionNameWithParen = args[1] // e.g., "slowInc("
    const functionArgs = args[2] // e.g., [-6, 2]
    
    // Extract function name (remove the opening parenthesis)
    const functionName = functionNameWithParen.replace('(', '')
    
    // Format arguments as comma-separated values
    let formattedArgs = ''
    if (Array.isArray(functionArgs)) {
      formattedArgs = functionArgs.map(arg => {
        if (typeof arg === 'string') {
          return `"${arg}"`
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg)
          } catch {
            return '[Object]'
          }
        }
        return String(arg)
      }).join(', ')
    } else {
      formattedArgs = String(functionArgs)
    }

    return { functionName, formattedArgs }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'var(--color-red-700)'
      case 'warn':
        return 'var(--color-amber-700)'
      case 'info':
        return 'var(--color-blue-700)'
      case 'debug':
        return 'var(--color-gray-700)'
      default:
        return 'var(--color-gray-700)'
    }
  }

  return (
    <DevToolsInfo
      title="Server Actions Monitor"
      isOpen={isOpen}
      close={close}
      triggerRef={triggerRef}
      {...otherProps}
    >
      <div className="server-actions-info">
        <div className="server-actions-info-header">
          {/* <div className="server-actions-info-controls">
            <button 
              className="server-actions-info-clear-btn"
              onClick={clearLogs}
            >
              Clear
            </button>
          </div> */}
        </div>

        <div className="server-actions-info-content">
          {logs.length === 0 ? (
            <div className="server-actions-info-empty">
              <p>No server action logs yet.</p>
              {/* <p>Execute server actions to see the latest 3 logs here.</p> */}
            </div>
          ) : (
            <div className="server-actions-info-logs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="server-actions-info-log-entry"
                  data-level={log.level}
                  data-new={log.id === newLogId}
                >
                  <div className="server-actions-info-log-meta">
                    <span className="server-actions-info-log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {/* <span 
                      className="server-actions-info-log-level"
                      style={{ color: getLevelColor(log.level) }}
                    >
                      [{log.level.toUpperCase()}]
                    </span> */}
                    {/* <span className="server-actions-info-log-source">
                      [{log.source}]
                    </span> */}
                  </div>
                  <div className="server-actions-info-log-content">
                    {(() => {
                      const formatted = formatServerAction(log.args)
                      if (typeof formatted === 'string') {
                        return <pre>{formatted}</pre>
                      }
                      return (
                        <pre>
                          <span className="function-name">{formatted.functionName}</span>
                          <span className="function-params">({formatted.formattedArgs})</span>
                        </pre>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DevToolsInfo>
  )
}

export const SERVER_ACTIONS_INFO_STYLES = `
  .server-actions-info {
    width: 500px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .server-actions-info-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 0 12px 0;
    border-bottom: 1px solid var(--color-gray-400);
    flex-shrink: 0;
  }

  .server-actions-info-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .server-actions-info-clear-btn {
    padding: 4px 8px;
    font-size: 12px;
    background: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    cursor: pointer;
    color: var(--color-gray-800);
    transition: background-color 0.2s ease;
  }

  .server-actions-info-clear-btn:hover {
    background: var(--color-gray-200);
  }

  .server-actions-info-content {
    flex: 1;
    overflow: hidden;
    background: var(--color-gray-100);
    min-height: 150px;
  }

  .server-actions-info-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 150px;
    color: var(--color-gray-600);
    text-align: center;
    padding: 20px;
  }

  .server-actions-info-empty p {
    margin: 2px 0;
    font-size: 13px;
  }

  .server-actions-info-logs {
    padding: 8px;
  }

  .server-actions-info-log-entry {
    padding: 8px;
    border-bottom: 1px solid var(--color-gray-300);
    font-family: var(--font-stack-monospace);
    font-size: 11px;
    line-height: 1.4;
    background: var(--color-background-100);
    border-radius: 4px;
    margin-bottom: 4px;
    transition: all 0.3s ease;
  }

  .server-actions-info-log-entry:hover {
    background: var(--color-gray-200);
  }

  .server-actions-info-log-entry[data-new="true"] {
    animation: slideInFromTop 0.4s ease-out;
  }

  @keyframes slideInFromTop {
    0% {
      transform: translateY(-20px);
      opacity: 0;
      background: var(--color-blue-100);
    }
    50% {
      background: var(--color-blue-100);
    }
    100% {
      transform: translateY(0);
      opacity: 1;
      background: var(--color-background-100);
    }
  }

  .server-actions-info-log-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    opacity: 0.8;
  }

  .server-actions-info-log-timestamp {
    color: var(--color-gray-600);
    font-weight: 500;
    font-size: 10px;
  }

  .server-actions-info-log-level {
    font-weight: 600;
    font-size: 10px;
  }

  .server-actions-info-log-source {
    color: var(--color-blue-600);
    font-weight: 500;
    font-size: 10px;
  }

  .server-actions-info-log-content {
    margin-left: 12px;
  }

  .server-actions-info-log-content pre {
    margin: 0;
    white-space: nowrap;
    overflow-x: auto;
    color: var(--color-gray-1000);
    font-size: 11px;
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-400) transparent;
  }

  .server-actions-info-log-content .function-name {
    font-weight: bold;
    color: var(--color-blue-700);
  }

  .server-actions-info-log-content .function-params {
    color: var(--color-gray-1000);
  }

  .server-actions-info-log-content pre::-webkit-scrollbar {
    height: 4px;
  }

  .server-actions-info-log-content pre::-webkit-scrollbar-track {
    background: transparent;
  }

  .server-actions-info-log-content pre::-webkit-scrollbar-thumb {
    background: var(--color-gray-400);
    border-radius: 2px;
  }

  .server-actions-info-log-content pre::-webkit-scrollbar-thumb:hover {
    background: var(--color-gray-500);
  }

  .server-actions-info-log-entry[data-level="error"] {
    border-left: 3px solid var(--color-red-400);
    background: var(--color-red-100);
  }

  .server-actions-info-log-entry[data-level="warn"] {
    border-left: 3px solid var(--color-amber-400);
    background: var(--color-amber-100);
  }

  .server-actions-info-log-entry[data-level="info"] {
    border-left: 3px solid var(--color-blue-400);
    background: var(--color-blue-100);
  }

  .server-actions-info-log-entry[data-level="debug"] {
    border-left: 3px solid var(--color-gray-400);
    background: var(--color-gray-200);
  }
` 