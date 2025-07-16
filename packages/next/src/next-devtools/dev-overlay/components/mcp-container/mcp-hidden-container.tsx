import React from 'react'
import { useDev0Context } from '../../context/dev-zero-context'
import { usePanelRouterContext } from '../../menu/context'

export const MCPHiddenContainer = () => {
  const { projects } = useDev0Context()
  const { panels } = usePanelRouterContext()

  // Get running projects
  const runningProjects = projects.filter((p) => p.status === 'running')
  console.log('we have these projects running', runningProjects)

  return (
    <div
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      {runningProjects.map((project) => {
        const panelName = `dev0-project-${project.name}`
        // Skip if panel is open (to avoid duplicate iframes)
        // @ts-expect-error
        if (panels.has(panelName)) {
          return null
        }

        return (
          <iframe
            key={project.name}
            src={`http://localhost:${project.port}`}
            title={`Dev-0 Project: ${project.name}`}
            style={{
              width: '1px',
              height: '1px',
              border: 'none',
            }}
          />
        )
      })}
    </div>
  )
}
