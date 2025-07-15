import React, { useState } from 'react'
import { DynamicPanel } from '../../panel/dynamic-panel'
import { Dev0Header } from './dev-zero-header'
import { Dev0Panel } from './dev-zero-panel'
import { useDevOverlayContext } from '../../../dev-overlay.browser'

interface Dev0ProjectPanelProps {
  project: {
    name: string
    cwd: string
    absolutePath?: string
    port?: number
    deploymentUrl?: string
  }
}

export function Dev0ProjectPanel({ project }: Dev0ProjectPanelProps) {
  const { state } = useDevOverlayContext()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DynamicPanel
      sharePanelSizeGlobally={false}
      sharePanelPositionGlobally={false}
      draggable
      sizeConfig={{
        kind: 'resizable',
        maxHeight: '90vh',
        maxWidth: '90vw',
        minHeight: 400 / state.scale,
        minWidth: 600 / state.scale,
        initialSize: {
          height: 300 / state.scale,
          width: 400 / state.scale,
        },
      }}
      header={
        <Dev0Header
          projectName={project.name}
          projectPath={project.absolutePath || project.cwd}
          deploymentUrl={project.deploymentUrl}
          port={project.port}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      }
    >
      <Dev0Panel
        projectName={project.name}
        port={project.port!}
        refreshKey={refreshKey}
      />
    </DynamicPanel>
  )
}