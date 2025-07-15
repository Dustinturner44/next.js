import React, { useRef, useState, useEffect } from 'react'
import { useDev0Context } from '../../context/dev-zero-context'
import { usePanelRouterContext, type PanelStateKind } from '../../menu/context'

interface Dev0Project {
  name: string
  status: 'running' | 'paused' | 'killed' | 'creating'
  port?: number
  pid?: number
  cwd: string
  absolutePath?: string
  createdAt: number
  isOptimistic?: boolean
  deploymentUrl?: string
}

interface ProjectTerminalProps {
  project: Dev0Project
  isVisible: boolean
}

export const ProjectTerminal: React.FC<ProjectTerminalProps> = ({
  project,
  isVisible,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [terminalSessionId] = useState(() => {
    const sessionId = `terminal-${project.name}-${Date.now()}`
    return sessionId
  })

  // Use absolutePath if available, otherwise construct from cwd
  const projectPath =
    project.absolutePath ||
    (project.cwd.startsWith('/')
      ? project.cwd
      : `/Users/robby/dev-0/packages/daemon/${project.cwd}`)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'iframe-mouse-event') {
        const { eventType, clientX, clientY, button, buttons } = event.data

        const syntheticEvent = new MouseEvent(eventType, {
          clientX,
          clientY,
          button,
          buttons,
          bubbles: true,
          cancelable: true,
        })

        document.dispatchEvent(syntheticEvent)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        visibility: isVisible ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        backgroundColor: '#000',
        zIndex: isVisible ? 1 : 0,
      }}
    >
      <iframe
        ref={iframeRef}
        src={`http://localhost:4262?session=${encodeURIComponent(terminalSessionId)}&cwd=${encodeURIComponent(projectPath)}&shell=${encodeURIComponent('/bin/zsh')}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#000',
        }}
        title={`Terminal - ${project.name}`}
      />
    </div>
  )
}

export const ProjectTerminalManager: React.FC = () => {
  const { projects } = useDev0Context()
  const { activePanel, openPanel } = usePanelRouterContext()
  const runningProjects = projects.filter((p) => p.status === 'running')

  const getProjectNameFromPanel = (panel: string | null): string | null => {
    if (!panel || !panel.startsWith('dev0-project-')) return null
    return panel.replace('dev0-project-', '')
  }

  const activePanelProjectName = getProjectNameFromPanel(activePanel)

  const [activeProjectName, setActiveProjectName] = useState<string | null>(
    () => {
      if (
        activePanelProjectName &&
        runningProjects.some((p) => p.name === activePanelProjectName)
      ) {
        return activePanelProjectName
      }
      return runningProjects[0]?.name || null
    }
  )

  useEffect(() => {
    if (
      activePanelProjectName &&
      runningProjects.some((p) => p.name === activePanelProjectName)
    ) {
      setActiveProjectName(activePanelProjectName)
    }
  }, [activePanelProjectName, runningProjects])

  useEffect(() => {
    if (
      activeProjectName &&
      !runningProjects.find((p) => p.name === activeProjectName)
    ) {
      setActiveProjectName(runningProjects[0]?.name || null)
    }
  }, [runningProjects, activeProjectName])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Project switcher header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '8px',
          zIndex: 10,
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' },
        }}
      >
        {runningProjects.map((project) => (
          <button
            key={project.name}
            onClick={() => {
              setActiveProjectName(project.name)
              openPanel(`dev0-project-${project.name}` as PanelStateKind)
            }}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor:
                activeProjectName === project.name
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
              color:
                activeProjectName === project.name
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'var(--font-stack-sans)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (activeProjectName !== project.name) {
                e.currentTarget.style.backgroundColor =
                  'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeProjectName !== project.name) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            <span>{project.name}</span>
            {project.port && (
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                :{project.port}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Terminal containers */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {runningProjects.map((project) => (
          <ProjectTerminal
            key={project.name}
            project={project}
            isVisible={activeProjectName === project.name}
          />
        ))}
      </div>

      {runningProjects.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255, 255, 255, 0.3)',
            fontFamily: 'var(--font-stack-sans)',
            fontSize: '13px',
          }}
        >
          No running projects
        </div>
      )}
    </div>
  )
}
