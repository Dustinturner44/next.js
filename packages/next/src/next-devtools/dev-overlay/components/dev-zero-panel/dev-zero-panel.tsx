import React, { useEffect, useState, useRef } from 'react'
import { css } from '../../utils/css'
import { Dev0RPC } from '../../utils/dev0-rpc'

interface Dev0PanelProps {
  projectName: string
  port: number
}

export const Dev0Panel: React.FC<Dev0PanelProps> = ({ projectName, port }) => {
  const iframeUrl = `http://localhost:${port}`
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isInstrumentationReady, setIsInstrumentationReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const rpcRef = useRef<Dev0RPC | null>(null)

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify it's from our iframe
      if (event.origin !== `http://localhost:${port}`) return

      // Handle instrumentation ready signal
      if (event.data.type === 'dev0-instrumentation-ready') {
        console.log('Dev0 instrumentation ready for:', projectName)
        setIsInstrumentationReady(true)
        return
      }

      // Handle execute requests from iframe
      if (event.data.type === 'dev0-execute-request') {
        const { id, fn, args } = event.data
        console.log(`🔧 Execute request from ${projectName}:`, {
          id,
          fn: fn.substring(0, 50) + '...',
          args,
        })

        try {
          // Reconstruct and execute the function in parent context
          // eslint-disable-next-line no-new-func
          const func = new Function('return ' + fn)()
          const result = await func(...args)

          // Send result back to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'dev0-execute-response',
                id,
                result,
                success: true,
              },
              '*'
            )
          }
        } catch (error) {
          console.error('Execute error:', error)
          // Send error back to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'dev0-execute-response',
                id,
                error: {
                  message:
                    error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined,
                  name: error instanceof Error ? error.name : 'Error',
                },
                success: false,
              },
              '*'
            )
          }
        }
        return
      }

      // Handle custom messages from the iframe
      if (event.data.type?.startsWith('dev0-')) {
        const messageType = event.data.type.replace('dev0-', '')
        console.log(
          `📨 Message from ${projectName}:`,
          messageType,
          event.data.data
        )

        // Handle specific message types
        if (messageType === 'app-ready') {
          console.log('🎉 App is ready!', event.data.data)
        } else if (messageType === 'color-change') {
          console.log('🌈 Color changed to:', event.data.data.color)
        } else if (messageType === 'request-parent-action') {
          console.log('🎯 Parent action requested:', event.data.data)
          // Could implement actual parent UI changes here
        }
        return
      }

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
    return () => {
      window.removeEventListener('message', handleMessage)
      // Clean up RPC
      if (rpcRef.current) {
        rpcRef.current.dispose()
        rpcRef.current = null
      }
    }
  }, [projectName, port])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--color-background-100)',
        borderBottomLeftRadius: 'var(--rounded-lg)',
        borderBottomRightRadius: 'var(--rounded-lg)',
        overflow: 'hidden',
        contain: 'layout size style',
      }}
    >
      {isLoading && !hasLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid var(--color-gray-alpha-200)',
              borderTopColor: 'var(--color-gray-600)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-gray-600)',
            }}
          >
            Loading...
          </div>
        </div>
      )}

      {/* Instrumentation status indicator */}
      {hasLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: isInstrumentationReady
              ? 'var(--color-green-alpha-200)'
              : 'var(--color-yellow-alpha-200)',
            color: isInstrumentationReady
              ? 'var(--color-green-800)'
              : 'var(--color-yellow-800)',
            fontSize: '10px',
            fontWeight: 500,
            zIndex: 20,
            opacity: 0.8,
            transition: 'all 0.3s ease-out',
          }}
          title={
            isInstrumentationReady ? 'Dev tools ready' : 'Loading dev tools...'
          }
        >
          {isInstrumentationReady ? '⚡' : '⏳'}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeUrl}
        onLoad={() => {
          // Add a small delay to ensure the iframe content is rendered
          setTimeout(() => {
            setHasLoaded(true)
            setTimeout(() => {
              setIsLoading(false)
              // Initialize RPC when iframe is loaded
              if (iframeRef.current) {
                rpcRef.current = new Dev0RPC(iframeRef.current)
                // Expose RPC globally for debugging
                ;(window as any).__DEV0_RPC__ = rpcRef.current

                // Example usage (for development)
                console.log('🚀 Dev0 instrumentation ready!')
                console.log(
                  'The iframe can now execute functions in parent context:'
                )
                console.log('// In iframe console: await window.dev.getTitle()')
                console.log(
                  '// In iframe console: await window.dev.execute(() => document.body.style.backgroundColor = "red")'
                )
                console.log(
                  '// In iframe console: await window.dev.log("Hello from iframe!")'
                )
              }
            }, 300)
          }, 100)
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          borderBottomLeftRadius: 'var(--rounded-lg)',
          borderBottomRightRadius: 'var(--rounded-lg)',
          opacity: hasLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
        title={`Dev-0 Project: ${projectName}`}
      />

      <style>{css`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
