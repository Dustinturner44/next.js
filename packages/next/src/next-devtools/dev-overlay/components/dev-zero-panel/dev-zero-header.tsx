import React, { useState } from 'react'
import { usePanelRouterContext, type PanelStateKind } from '../../menu/context'
import { usePanelContext } from '../../menu/panel-router'
import { useDev0Context } from '../../context/dev-zero-context'
import { css } from '../../utils/css'

interface Dev0HeaderProps {
  projectName: string
  projectPath: string
}

export function Dev0Header({ projectName, projectPath }: Dev0HeaderProps) {
  const { closePanel } = usePanelRouterContext()
  const { name } = usePanelContext()
  const { fetchProjects } = useDev0Context()

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)

  const handleCopyPath = () => {
    navigator.clipboard.writeText(projectPath)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

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

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${projectName}? This cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('http://localhost:40000/delete-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Close the panel and refresh projects list
      closePanel(name as PanelStateKind)
      await fetchProjects()
    } catch (error) {
      console.error('Delete error:', error)
      alert(
        `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        userSelect: 'none',
        borderBottom: '1px solid var(--color-gray-alpha-400)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          minWidth: 0,
          flex: 1,
          marginRight: '16px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            fontWeight: 'normal',
          }}
        >
          {projectName}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-gray-700)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: 1,
            }}
            title={projectPath}
          >
            {projectPath}
          </span>
          <button
            onClick={handleCopyPath}
            className="copy-path-button"
            style={{
              padding: '2px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: copiedPath
                ? 'var(--color-green-700)'
                : 'var(--color-gray-700)',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            title={copiedPath ? 'Copied!' : 'Copy path'}
          >
            {copiedPath ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {deploymentUrl && (
          <a
            href={deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="deployment-link"
            style={{
              color: 'var(--color-blue-700)',
              textDecoration: 'none',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            title={deploymentUrl}
          >
            <span
              style={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {new URL(deploymentUrl).hostname}
            </span>
            <svg
              width="10"
              height="10"
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

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="deploy-button"
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: isDeploying
              ? 'var(--color-gray-600)'
              : 'var(--color-gray-900)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: isDeploying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
          title={deployError || 'Deploy to Vercel'}
        >
          {isDeploying ? (
            <>
              <span className="spinner" />
              <span>Deploying...</span>
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"></path>
                <polyline points="16 16 12 12 8 16"></polyline>
              </svg>
              <span>Deploy</span>
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="delete-button"
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: isDeleting
              ? 'var(--color-gray-600)'
              : 'var(--color-red-700)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
          title="Delete project"
        >
          {isDeleting ? (
            <span className="spinner" />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          )}
        </button>

        <button
          id="_next-devtools-panel-close"
          className="dev-tools-info-close-button"
          onClick={() => closePanel(name as PanelStateKind)}
          aria-label="Close devtools panel"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: 'var(--color-gray-900)',
            transition: 'background-color 0.2s',
          }}
        >
          <XIcon />
        </button>
      </div>

      <style>{css`
        .dev-tools-info-close-button:focus-visible {
          outline: var(--focus-ring);
        }

        .deploy-button:not(:disabled):hover {
          background-color: var(--color-gray-alpha-200) !important;
        }

        .delete-button:not(:disabled):hover {
          background-color: var(--color-red-alpha-200) !important;
        }

        .deployment-link:hover {
          background-color: var(--color-blue-alpha-200) !important;
        }

        .copy-path-button:hover {
          background-color: var(--color-gray-alpha-200) !important;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top-color: currentColor;
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

function XIcon({ size = 22 }: { size?: number }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
