import React from 'react'

interface Dev0PanelProps {
  projectName: string
  port: number
}

export const Dev0Panel: React.FC<Dev0PanelProps> = ({ projectName, port }) => {
  const iframeUrl = `http://localhost:${port}`

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background-100)',
      }}
    >
      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'white',
          borderBottomLeftRadius: 'var(--rounded-lg)',
          borderBottomRightRadius: 'var(--rounded-lg)',
        }}
        title={`Dev-0 Project: ${projectName}`}
      />
    </div>
  )
}
