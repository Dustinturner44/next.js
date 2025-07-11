import React, { useState, useEffect } from 'react'
import { css } from '../../../utils/css'

interface ServerActionLogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  args: any[]
  timestamp: number
  source: 'server-action' | 'server' | 'edge-server'
  id: string
}

export function ServerActionsTab() {
  const [logs, setLogs] = useState<ServerActionLogEntry[]>([])
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const logsEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isAutoScroll])

  // Store logs in a global handler that can be accessed by HMR
  useEffect(() => {
    const handleServerLog = (logEntry: ServerActionLogEntry) => {
      setLogs(prev => [...prev, logEntry])
    }

    // Register global handler for server logs
    ;(window as any).__NEXT_SERVER_ACTIONS_LOG_HANDLER = handleServerLog

    return () => {
      ;(window as any).__NEXT_SERVER_ACTIONS_LOG_HANDLER = null
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
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

  const formatArgs = (args: any[]) => {
    return args.map((arg, index) => {
      if (typeof arg === 'string') {
        return arg
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return '[Object]'
        }
      }
      return String(arg)
    }).join(' ')
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'var(--color-red-500)'
      case 'warn':
        return 'var(--color-yellow-500)'
      case 'info':
        return 'var(--color-blue-500)'
      case 'debug':
        return 'var(--color-purple-500)'
      default:
        return 'var(--color-gray-700)'
    }
  }

  return (
    <div data-nextjs-server-actions-tab>
      <div data-nextjs-server-actions-tab-header>
        <h3>Server Actions Monitor</h3>
        <div data-nextjs-server-actions-tab-controls>
          <label>
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          <button onClick={clearLogs}>Clear logs</button>
        </div>
      </div>

      <div data-nextjs-server-actions-tab-content>
        {logs.length === 0 ? (
          <div data-nextjs-server-actions-tab-empty>
            <p>No server action logs yet.</p>
            <p>Server actions will appear here when they're executed.</p>
          </div>
        ) : (
          <div data-nextjs-server-actions-tab-logs>
            {logs.map((log) => (
              <div
                key={log.id}
                data-nextjs-server-actions-tab-log-entry
                data-level={log.level}
              >
                <div data-nextjs-server-actions-tab-log-timestamp>
                  {formatTimestamp(log.timestamp)}
                </div>
                <div 
                  data-nextjs-server-actions-tab-log-level
                  style={{ color: getLevelColor(log.level) }}
                >
                  [{log.level.toUpperCase()}]
                </div>
                <div data-nextjs-server-actions-tab-log-source>
                  [{log.source}]
                </div>
                <div data-nextjs-server-actions-tab-log-content>
                  <pre>{formatArgs(log.args)}</pre>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export const SERVER_ACTIONS_TAB_STYLES = css`
  [data-nextjs-server-actions-tab] {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  [data-nextjs-server-actions-tab-header] {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--color-gray-400);
    flex-shrink: 0;
  }

  [data-nextjs-server-actions-tab-header] h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-gray-1000);
  }

  [data-nextjs-server-actions-tab-controls] {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  [data-nextjs-server-actions-tab-controls] label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-gray-700);
    cursor: pointer;
  }

  [data-nextjs-server-actions-tab-controls] button {
    padding: 6px 12px;
    font-size: 14px;
    background: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  [data-nextjs-server-actions-tab-controls] button:hover {
    background: var(--color-gray-200);
  }

  [data-nextjs-server-actions-tab-content] {
    flex: 1;
    overflow: auto;
    background: var(--color-gray-50);
  }

  [data-nextjs-server-actions-tab-empty] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--color-gray-600);
    text-align: center;
  }

  [data-nextjs-server-actions-tab-empty] p {
    margin: 4px 0;
  }

  [data-nextjs-server-actions-tab-logs] {
    padding: 8px;
  }

  [data-nextjs-server-actions-tab-log-entry] {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--color-gray-200);
    font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
  }

  [data-nextjs-server-actions-tab-log-entry]:hover {
    background: var(--color-gray-100);
  }

  [data-nextjs-server-actions-tab-log-timestamp] {
    color: var(--color-gray-500);
    font-weight: 500;
    white-space: nowrap;
    font-size: 11px;
  }

  [data-nextjs-server-actions-tab-log-level] {
    font-weight: 600;
    white-space: nowrap;
    font-size: 11px;
  }

  [data-nextjs-server-actions-tab-log-source] {
    color: var(--color-blue-600);
    font-weight: 500;
    white-space: nowrap;
    font-size: 11px;
  }

  [data-nextjs-server-actions-tab-log-content] {
    flex: 1;
    min-width: 0;
  }

  [data-nextjs-server-actions-tab-log-content] pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-gray-800);
  }

  [data-nextjs-server-actions-tab-log-entry][data-level="error"] {
    background: var(--color-red-50);
    border-left: 3px solid var(--color-red-400);
  }

  [data-nextjs-server-actions-tab-log-entry][data-level="warn"] {
    background: var(--color-yellow-50);
    border-left: 3px solid var(--color-yellow-400);
  }

  [data-nextjs-server-actions-tab-log-entry][data-level="info"] {
    background: var(--color-blue-50);
    border-left: 3px solid var(--color-blue-400);
  }

  [data-nextjs-server-actions-tab-log-entry][data-level="debug"] {
    background: var(--color-purple-50);
    border-left: 3px solid var(--color-purple-400);
  }
` 