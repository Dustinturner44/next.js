import React, { useState } from 'react'
import { Dev0Header } from './dev-zero-header'
import { Dev0Panel } from './dev-zero-panel'

interface Dev0WrapperProps {
  projectName: string
  projectPath: string
  deploymentUrl?: string
  port: number
}

export function Dev0Wrapper({
  projectName,
  projectPath,
  deploymentUrl,
  port,
}: Dev0WrapperProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Dev0Header
        projectName={projectName}
        projectPath={projectPath}
        deploymentUrl={deploymentUrl}
        port={port}
        onRefresh={handleRefresh}
      />
      <Dev0Panel
        projectName={projectName}
        port={port}
        refreshKey={refreshKey}
      />
    </>
  )
}