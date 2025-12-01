import { useEffect, useState } from 'react'
import { css } from '../../utils/css'

function WarningIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function AlertCircleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  )
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface Insight {
  id: string
  category: 'sensitive-data' | 'non-serializable'
  severity: 'warning' | 'error'
  serverFile: string
  clientFile: string
  componentName: string
  propPath: string
  message: string
  expertPrompt: string
  jsxLocation?: {
    line: number
    column: number
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'sensitive-data':
      return 'Sensitive Data'
    case 'non-serializable':
      return 'Non-Serializable'
    default:
      return category
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'sensitive-data':
      return 'var(--color-amber-700)'
    case 'non-serializable':
      return 'var(--color-blue-700)'
    default:
      return 'var(--color-gray-700)'
  }
}

function InsightCard({ insight }: { insight: Insight }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(insight.expertPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      className="insight-card"
      style={
        {
          '--category-color': getCategoryColor(insight.category),
        } as React.CSSProperties
      }
    >
      <div className="insight-header">
        <div className="insight-category-badge">
          {insight.category === 'sensitive-data' ? (
            <AlertCircleIcon size={14} />
          ) : (
            <WarningIcon size={14} />
          )}
          <span>{getCategoryLabel(insight.category)}</span>
        </div>
        <button
          className="insight-copy-button"
          onClick={handleCopy}
          title="Copy expert prompt for AI analysis"
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>
      </div>

      <div className="insight-body">
        <div className="insight-location">
          <code className="insight-file">
            {insight.serverFile}
            {insight.jsxLocation && (
              <span className="insight-line">
                :{insight.jsxLocation.line}:{insight.jsxLocation.column}
              </span>
            )}
          </code>
          <span className="insight-arrow">→</span>
          <code className="insight-component">
            &lt;{insight.componentName} /&gt;
          </code>
        </div>

        <code className="insight-prop-path">{insight.propPath}</code>

        <p className="insight-message">{insight.message}</p>

        <div className="insight-client-file">
          <span className="insight-client-label">Client:</span>
          <code className="insight-client-path">{insight.clientFile}</code>
        </div>
      </div>
    </div>
  )
}

export function BoundaryInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/__nextjs_insights')
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        setInsights([])
      } else {
        setInsights(data.insights || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights')
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="insights-loading">
        <div className="insights-spinner" />
        <p>Analyzing your application...</p>
        <style>{css`
          .insights-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            color: var(--color-gray-700);
          }

          .insights-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--color-gray-alpha-300);
            border-top-color: var(--color-blue-700);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .insights-loading p {
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="insights-error">
        <AlertCircleIcon size={48} />
        <h3 className="insights-error-title">Analysis Error</h3>
        <p className="insights-error-message">{error}</p>
        <button className="insights-retry-button" onClick={fetchInsights}>
          <RefreshIcon size={16} />
          Retry
        </button>
        <style>{css`
          .insights-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
            color: var(--color-red-700);
          }

          .insights-error svg {
            margin-bottom: 16px;
            opacity: 0.7;
          }

          .insights-error-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 500;
            color: var(--color-text-primary);
          }

          .insights-error-message {
            margin: 0 0 16px 0;
            font-size: 13px;
            line-height: 1.5;
            color: var(--color-gray-700);
          }

          .insights-retry-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--color-blue-700);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
          }

          .insights-retry-button:hover {
            background: var(--color-blue-800);
          }
        `}</style>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="insights-empty">
        <ShieldIcon size={48} />
        <h3 className="insights-empty-title">No Issues Detected</h3>
        <p className="insights-empty-description">
          No security or serialization issues found in your application.
        </p>
        <button className="insights-refresh-button" onClick={fetchInsights}>
          <RefreshIcon size={14} />
          Refresh
        </button>
        <style>{css`
          .insights-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
            color: var(--color-gray-700);
          }

          .insights-empty svg:first-child {
            margin-bottom: 16px;
            opacity: 0.5;
          }

          .insights-empty-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 500;
            color: var(--color-text-primary);
          }

          .insights-empty-description {
            margin: 0 0 16px 0;
            font-size: 14px;
            line-height: 1.5;
            max-width: 320px;
            color: var(--color-gray-700);
          }

          .insights-refresh-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: var(--color-background-100);
            color: var(--color-gray-900);
            border: 1px solid var(--color-gray-alpha-400);
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
          }

          .insights-refresh-button:hover {
            background: var(--color-gray-alpha-100);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <div className="insights-header-content">
          <ShieldIcon size={18} />
          <span className="insights-count">
            {insights.length} {insights.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>
        <button
          className="insights-refresh-button-small"
          onClick={fetchInsights}
        >
          <RefreshIcon size={14} />
        </button>
      </div>

      <div className="insights-list">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      <style>{css`
        .insights-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-background-100);
        }

        .insights-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-gray-alpha-400);
          background: var(--color-background-200);
          flex-shrink: 0;
        }

        .insights-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .insights-header-content svg {
          color: var(--color-amber-700);
          flex-shrink: 0;
        }

        .insights-count {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .insights-refresh-button-small {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          background: var(--color-background-100);
          color: var(--color-gray-900);
          border: 1px solid var(--color-gray-alpha-400);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .insights-refresh-button-small:hover {
          background: var(--color-gray-alpha-100);
        }

        .insights-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          min-height: 0;
        }

        .insight-card {
          background: var(--color-background-100);
          border: 1px solid var(--color-gray-alpha-400);
          border-left: 3px solid var(--category-color);
          border-radius: 6px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .insight-card:last-child {
          margin-bottom: 0;
        }

        .insight-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--color-background-200);
          border-bottom: 1px solid var(--color-gray-alpha-400);
        }

        .insight-category-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--category-color);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .insight-copy-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--color-background-100);
          color: var(--color-gray-900);
          border: 1px solid var(--color-gray-alpha-400);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .insight-copy-button:hover {
          background: var(--color-gray-alpha-100);
        }

        .insight-body {
          padding: 12px;
        }

        .insight-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 11px;
          flex-wrap: wrap;
        }

        .insight-file {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          color: var(--color-gray-700);
          background: var(--color-gray-alpha-100);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }

        .insight-line {
          color: var(--color-gray-600);
          font-weight: normal;
        }

        .insight-arrow {
          color: var(--color-gray-500);
          font-size: 12px;
        }

        .insight-component {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          color: var(--color-syntax-function);
          font-size: 11px;
          font-weight: 500;
        }

        .insight-prop-path {
          display: inline-block;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          background: var(--color-gray-alpha-200);
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          color: var(--color-text-primary);
        }

        .insight-message {
          margin: 0 0 8px 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--color-gray-900);
        }

        .insight-client-file {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 11px;
          padding-top: 8px;
          border-top: 1px solid var(--color-gray-alpha-200);
        }

        .insight-client-label {
          color: var(--color-gray-600);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .insight-client-path {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          color: var(--color-gray-700);
          font-size: 10px;
          word-break: break-all;
        }

        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .insights-header {
            background: var(--color-background-100);
          }

          .insight-header {
            background: var(--color-background-100);
          }
        }
      `}</style>
    </div>
  )
}
