import React, { useEffect } from 'react'

interface Dev0PanelProps {
  projectName: string
  port: number
}

export const Dev0Panel: React.FC<Dev0PanelProps> = ({ projectName, port }) => {
  const iframeUrl = `http://localhost:${port}`

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify it's from our iframe
      if (event.origin !== `http://localhost:${port}`) return

      if (
        event.data.type === 'screenshot' &&
        event.data.projectName === projectName
      ) {
        try {
          // Send screenshot to server
          const response = await fetch(
            'http://localhost:40000/save-screenshot',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectName: event.data.projectName,
                screenshot: event.data.screenshot,
              }),
            }
          )

          if (!response.ok) {
            console.error('Failed to save screenshot')
          }
        } catch (error) {
          console.error('Error saving screenshot:', error)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [projectName, port])

  return (
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
  )
}
