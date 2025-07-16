import React from 'react'
import { useDev0Context } from '../../context/dev-zero-context'
import { usePanelRouterContext } from '../../menu/context'
import { Dev0Panel } from '../dev-zero-panel/dev-zero-panel'

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
        width: '400px',
        height: '300px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {runningProjects.map((project) => {
        const panelName = `dev0-project-${project.name}`
        // Skip if panel is open (to avoid duplicate panels)
        // @ts-expect-error
        if (panels.has(panelName)) {
          return null
        }

        return (
          <div
            key={project.name}
            style={{
              width: '400px',
              height: '300px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <Dev0Panel
              projectName={project.name}
              port={project.port!}
            />
          </div>
        )
      })}
    </div>
  )
}
