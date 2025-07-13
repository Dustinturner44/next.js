import React, { useState, useEffect } from 'react'
import { css } from '../../utils/css'

interface HubProject {
  name: string
  deploymentUrl: string
  projectName: string
  description?: string
  githubUrl?: string
  publishedAt: number
  screenshotUrl?: string
}

interface CloneStatus {
  [projectName: string]: 'cloning' | 'success' | 'error'
}

export const HubPanel: React.FC = () => {
  const [projects, setProjects] = useState<HubProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cloneStatus, setCloneStatus] = useState<CloneStatus>({})
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    fetchHubProjects()
  }, [])

  const fetchHubProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('http://localhost:40000/hub/projects')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setProjects(data.projects || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch hub projects'
      )
      console.error('Failed to fetch hub projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background-100)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-gray-alpha-400)',
          backgroundColor: 'var(--color-background-200)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              backgroundColor: 'var(--color-background-100)',
              border: '1px solid var(--color-gray-alpha-400)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={fetchHubProjects}
            disabled={isLoading}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              backgroundColor: 'var(--color-background-100)',
              border: '1px solid var(--color-gray-alpha-400)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            className="refresh-button"
            title="Refresh projects"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isLoading ? 'spinning' : ''}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          position: 'relative',
        }}
      >
        {notification && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor:
                notification.type === 'success'
                  ? 'var(--color-green-alpha-200)'
                  : 'var(--color-red-alpha-200)',
              color:
                notification.type === 'success'
                  ? 'var(--color-green-800)'
                  : 'var(--color-red-800)',
              border: `1px solid ${
                notification.type === 'success'
                  ? 'var(--color-green-alpha-400)'
                  : 'var(--color-red-alpha-400)'
              }`,
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {notification.message}
          </div>
        )}
        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-700)' }}>
            Loading hub projects...
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--color-red-700)',
              padding: '20px',
            }}
          >
            Error: {error}
          </div>
        )}

        {!isLoading && !error && filteredProjects.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--color-gray-700)',
              padding: '20px',
            }}
          >
            {searchQuery
              ? 'No projects match your search'
              : 'No projects in the hub yet'}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {filteredProjects.map((project) => (
            <div
              key={project.name}
              className="hub-project-card"
              style={{
                backgroundColor: 'var(--color-background-200)',
                border: '1px solid var(--color-gray-alpha-400)',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundColor: 'var(--color-gray-alpha-100)',
                  overflow: 'hidden',
                }}
                className="thumbnail-container"
              >
                <div
                  className="thumbnail-loading"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '30px',
                    height: '30px',
                    opacity: 0.3,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '2px solid var(--color-gray-alpha-400)',
                      borderTopColor: 'var(--color-gray-700)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
                <iframe
                  src={project.deploymentUrl}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '200%',
                    height: '200%',
                    border: 'none',
                    pointerEvents: 'none',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-out',
                  }}
                  onLoad={(e) => {
                    const iframe = e.target as HTMLIFrameElement
                    setTimeout(() => {
                      iframe.style.opacity = '1'
                      const loader = iframe.parentElement?.querySelector(
                        '.thumbnail-loading'
                      ) as HTMLElement
                      if (loader) {
                        loader.style.opacity = '0'
                      }
                    }, 100)
                  }}
                  title={project.projectName}
                  sandbox="allow-same-origin allow-scripts"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    cursor: 'pointer',
                    background:
                      'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.03) 100%)',
                  }}
                  onClick={() => window.open(project.deploymentUrl, '_blank')}
                />
              </div>

              <div style={{ padding: '10px' }}>
                <h3
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={project.projectName}
                >
                  {project.projectName}
                </h3>

                {project.description && (
                  <p
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '11px',
                      color: 'var(--color-gray-700)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={project.description}
                  >
                    {project.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10px',
                      color: 'var(--color-gray-600)',
                    }}
                  >
                    <span>
                      {new Date(project.publishedAt).toLocaleDateString()}
                    </span>
                    {project.githubUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--color-blue-700)',
                            textDecoration: 'none',
                            fontSize: '10px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          GitHub
                        </a>
                      </>
                    )}
                  </div>

                  {project.githubUrl && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        setCloneStatus((prev) => ({
                          ...prev,
                          [project.name]: 'cloning',
                        }))

                        try {
                          const response = await fetch(
                            'http://localhost:40000/clone-and-register',
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                githubUrl: project.githubUrl,
                                projectName: project.projectName,
                              }),
                            }
                          )

                          const data = await response.json()
                          if (data.error) {
                            setCloneStatus((prev) => ({
                              ...prev,
                              [project.name]: 'error',
                            }))
                            setNotification({
                              message: `Failed to clone: ${data.error}`,
                              type: 'error',
                            })
                            setTimeout(() => {
                              setCloneStatus((prev) => {
                                const newStatus = { ...prev }
                                delete newStatus[project.name]
                                return newStatus
                              })
                            }, 3000)
                          } else {
                            setCloneStatus((prev) => ({
                              ...prev,
                              [project.name]: 'success',
                            }))
                            setNotification({
                              message: 'Project cloned successfully!',
                              type: 'success',
                            })
                            // Trigger a refresh of projects in Dev0Context
                            window.dispatchEvent(
                              new CustomEvent('dev0-refresh-projects')
                            )
                            setTimeout(() => {
                              setCloneStatus((prev) => {
                                const newStatus = { ...prev }
                                delete newStatus[project.name]
                                return newStatus
                              })
                            }, 2000)
                          }
                        } catch (error) {
                          setCloneStatus((prev) => ({
                            ...prev,
                            [project.name]: 'error',
                          }))
                          setNotification({
                            message: `Failed to clone: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            type: 'error',
                          })
                          setTimeout(() => {
                            setCloneStatus((prev) => {
                              const newStatus = { ...prev }
                              delete newStatus[project.name]
                              return newStatus
                            })
                          }, 3000)
                        }

                        // Clear notification after 3 seconds
                        setTimeout(() => setNotification(null), 3000)
                      }}
                      disabled={cloneStatus[project.name] === 'cloning'}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-gray-alpha-400)',
                        backgroundColor:
                          cloneStatus[project.name] === 'success'
                            ? 'var(--color-green-alpha-100)'
                            : cloneStatus[project.name] === 'error'
                              ? 'var(--color-red-alpha-100)'
                              : 'var(--color-background-100)',
                        color:
                          cloneStatus[project.name] === 'success'
                            ? 'var(--color-green-700)'
                            : cloneStatus[project.name] === 'error'
                              ? 'var(--color-red-700)'
                              : 'var(--color-gray-900)',
                        cursor:
                          cloneStatus[project.name] === 'cloning'
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                      }}
                      className="clone-button"
                    >
                      {cloneStatus[project.name] === 'cloning' ? (
                        <>
                          <span className="spinner" />
                          <span>Cloning...</span>
                        </>
                      ) : cloneStatus[project.name] === 'success' ? (
                        <>
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
                          <span>Cloned!</span>
                        </>
                      ) : cloneStatus[project.name] === 'error' ? (
                        <>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                          <span>Failed</span>
                        </>
                      ) : (
                        <>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                          </svg>
                          <span>Clone</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{css`
        .hub-project-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: var(--color-gray-alpha-600);
        }

        input:focus {
          border-color: var(--color-blue-700) !important;
        }

        .refresh-button:not(:disabled):hover {
          background-color: var(--color-gray-alpha-200) !important;
          border-color: var(--color-gray-alpha-600) !important;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .clone-button:not(:disabled):hover {
          background-color: var(--color-gray-alpha-200) !important;
          border-color: var(--color-gray-alpha-600) !important;
        }

        .spinner {
          width: 10px;
          height: 10px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
