import React, { useState, useEffect } from 'react'
import { css } from '../../utils/css'

interface HubProject {
  name: string
  deploymentUrl: string
  projectName: string
  description?: string
  githubUrl?: string
  publishedAt: number
}

export const HubPanel: React.FC = () => {
  const [projects, setProjects] = useState<HubProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            backgroundColor: 'var(--color-background-100)',
            border: '1px solid var(--color-gray-alpha-400)',
            borderRadius: '6px',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredProjects.map((project) => (
            <div
              key={project.name}
              className="hub-project-card"
              style={{
                backgroundColor: 'var(--color-background-200)',
                border: '1px solid var(--color-gray-alpha-400)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={project.deploymentUrl}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    pointerEvents: 'none',
                  }}
                  title={project.projectName}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(project.deploymentUrl, '_blank')}
                />
              </div>

              <div style={{ padding: '12px' }}>
                <h3
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {project.projectName}
                </h3>

                {project.description && (
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: 'var(--color-gray-700)',
                    }}
                  >
                    {project.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
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
                        }}
                      >
                        GitHub
                      </a>
                    </>
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
      `}</style>
    </div>
  )
}
