import React, { useEffect } from 'react'
import { useDev0Context } from '../../context/dev-zero-context'
import { usePanelRouterContext } from '../../menu/context'
import { Dev0Panel } from '../dev-zero-panel/dev-zero-panel'

export const MCPHiddenContainer = () => {
  const { projects } = useDev0Context()
  const { panels } = usePanelRouterContext()

  // Get running projects
  const runningProjects = projects.filter((p) => p.status === 'running')
  console.log('we have these projects running', runningProjects)
  
  // Debug panel state
  console.log('Current panels:', Array.from(panels))
  
  // Check which projects need hidden panels
  const projectsNeedingHiddenPanels = runningProjects
  
  console.log('Projects needing hidden panels:', projectsNeedingHiddenPanels.map(p => p.name))
  
  // Log when panels change
  useEffect(() => {
    console.log('MCPHiddenContainer: panels changed to:', Array.from(panels))
  }, [panels])

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
        const hasOpenPanel = panels.has(panelName)
        
        console.log(`Rendering check for ${project.name}: hasOpenPanel=${hasOpenPanel}`)
        
        if (hasOpenPanel) {
          console.log(`Skipping hidden panel for ${project.name} - panel is open`)
          return null
        }

        console.log(`Rendering hidden panel for ${project.name}`)
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
              key={`hidden-${project.name}`} // Force re-render when switching to hidden
            />
          </div>
        )
      })}
    </div>
  )
}
