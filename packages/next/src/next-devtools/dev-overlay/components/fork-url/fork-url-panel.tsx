import React, { useState, useRef, useEffect } from 'react'
import { usePanelRouterContext } from '../../menu/context'
import { useDev0Context } from '../../context/dev-zero-context'

export function ForkUrlPanel() {
  const [url, setUrl] = useState('')
  const [isForking, setIsForking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { closePanel, togglePanel } = usePanelRouterContext()
  const { projects, fetchProjects } = useDev0Context()

  useEffect(() => {
    // Focus input when panel opens
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleFork = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setIsForking(true)
    setError(null)
    setSuccess(false)

    try {
      // First, find the project in the hub by deployment URL
      const hubResponse = await fetch('http://localhost:40000/get-hub-projects')
      const hubData = await hubResponse.json()

      if (!hubData.projects || !Array.isArray(hubData.projects)) {
        throw new Error('Failed to fetch hub projects')
      }

      // Find project with matching deployment URL
      const project = hubData.projects.find((p: any) => 
        p.deploymentUrl && (
          p.deploymentUrl === url || 
          p.deploymentUrl.includes(url) || 
          url.includes(p.deploymentUrl)
        )
      )

      if (!project) {
        throw new Error('No project found with that deployment URL')
      }

      // Check if already forked
      const existingProject = projects.find(p => p.name === project.name)
      if (existingProject) {
        setSuccess(true)
        setTimeout(() => {
          closePanel('fork-url')
          // Open the existing project panel
          togglePanel(`dev0-project-${project.name}`)
        }, 1000)
        return
      }

      // Fork the project
      const forkResponse = await fetch('http://localhost:40000/fork-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: project.owner,
          name: project.name,
          isTemplate: project.isTemplate || false,
        }),
      })

      const forkData = await forkResponse.json()

      if (!forkResponse.ok) {
        throw new Error(forkData.error || 'Fork failed')
      }

      // Refresh projects list
      await fetchProjects()

      setSuccess(true)
      
      // Close this panel and open the new project after a short delay
      setTimeout(() => {
        closePanel('fork-url')
        togglePanel(`dev0-project-${project.name}`)
      }, 1500)

    } catch (error) {
      console.error('Fork error:', error)
      setError(error instanceof Error ? error.message : 'Fork failed')
      setIsForking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isForking) {
      handleFork()
    } else if (e.key === 'Escape') {
      closePanel('fork-url')
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      <div>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          Fork from URL
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--color-gray-600)',
          }}
        >
          Enter a deployment URL to fork its project
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          ref={inputRef}
          type="url"
          placeholder="https://example.vercel.app"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isForking || success}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            border: '1px solid var(--color-gray-alpha-400)',
            borderRadius: '6px',
            backgroundColor: 'var(--color-background-100)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-gray-alpha-600)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-gray-alpha-400)'
          }}
        />

        {error && (
          <div
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              color: 'var(--color-red-700)',
              backgroundColor: 'var(--color-red-alpha-100)',
              borderRadius: '4px',
              border: '1px solid var(--color-red-alpha-400)',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              color: 'var(--color-green-700)',
              backgroundColor: 'var(--color-green-alpha-100)',
              borderRadius: '4px',
              border: '1px solid var(--color-green-alpha-400)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✓</span>
            <span>Project forked successfully!</span>
          </div>
        )}

        <button
          onClick={handleFork}
          disabled={isForking || !url.trim() || success}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '6px',
            backgroundColor: isForking || success
              ? 'var(--color-gray-400)'
              : 'var(--color-gray-900)',
            color: 'white',
            cursor: isForking || !url.trim() || success ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            if (!isForking && url.trim() && !success) {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-800)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isForking && !success) {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-900)'
            }
          }}
        >
          {isForking ? (
            <>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Forking...</span>
            </>
          ) : success ? (
            <>
              <span>✓</span>
              <span>Forked!</span>
            </>
          ) : (
            'Fork Project'
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}