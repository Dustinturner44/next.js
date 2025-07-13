import React, { useState } from 'react'
import { css } from '../../utils/css'

interface Dev0PanelProps {
  projectName: string
  port: number
}

export const Dev0Panel: React.FC<Dev0PanelProps> = ({ projectName, port }) => {
  const iframeUrl = `http://localhost:${port}`
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployError(null)

    try {
      const response = await fetch('http://localhost:40000/deploy-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.url) {
        setDeploymentUrl(data.url)
      }
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : 'Deploy failed')
      console.error('Deploy error:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background-100)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-gray-alpha-400)',
          backgroundColor: 'var(--color-background-200)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="deploy-button"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDeploying
                ? 'var(--color-gray-alpha-400)'
                : 'var(--color-blue-700)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isDeploying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
          >
            {isDeploying ? (
              <>
                <span className="spinner" />
                Deploying...
              </>
            ) : (
              'Deploy to Vercel'
            )}
          </button>

          {deploymentUrl && (
            <a
              href={deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-blue-700)',
                textDecoration: 'none',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {deploymentUrl}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          )}

          {deployError && (
            <span style={{ color: 'var(--color-red-700)', fontSize: '13px' }}>
              Error: {deployError}
            </span>
          )}
        </div>
      </div>

      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          backgroundColor: 'white',
          borderBottomLeftRadius: 'var(--rounded-lg)',
          borderBottomRightRadius: 'var(--rounded-lg)',
        }}
        title={`Dev-0 Project: ${projectName}`}
      />

      <style>{css`
        .deploy-button:not(:disabled):hover {
          background-color: var(--color-blue-800) !important;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
