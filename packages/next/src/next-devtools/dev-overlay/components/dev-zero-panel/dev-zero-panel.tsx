import React, { useEffect, useState, useRef } from 'react'
import { css } from '../../utils/css'

interface Dev0PanelProps {
  projectName: string
  port: number
  refreshKey?: number
}

export const Dev0Panel: React.FC<Dev0PanelProps> = ({
  projectName,
  port,
  refreshKey = 0,
}) => {
  const iframeUrl = `http://localhost:${port}`
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isInstrumentationReady, setIsInstrumentationReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (refreshKey > 0 && iframeRef.current) {
      setIsLoading(true)
      setHasLoaded(false)
      setHasError(false)
      iframeRef.current.src = `${iframeUrl}?refresh=${refreshKey}`
    }
  }, [refreshKey, iframeUrl])

  useEffect(() => {
    if (hasError) {
      retryIntervalRef.current = setInterval(() => {
        setRetryCount((prev) => prev + 1)
        setHasError(false)
        setIsLoading(true)
        setHasLoaded(false)
        // Force iframe reload
        if (iframeRef.current) {
          iframeRef.current.src = `${iframeUrl}?retry=${Date.now()}`
        }
      }, 2000)

      return () => {
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current)
        }
      }
    }
  }, [hasError, iframeUrl])

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== `http://localhost:${port}`) return

      if (event.data.type === 'dev0-instrumentation-ready') {
        console.log('Dev0 instrumentation ready for:', projectName)
        setIsInstrumentationReady(true)
        return
      }

      if (event.data.type === 'dev0-execute-request') {
        const { id, fn, args } = event.data

        try {
          const func = new Function('return ' + fn)()
          const result = await func(...args)

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
        return
      }

      if (event.data.type?.startsWith('dev0-')) {
        const messageType = event.data.type.replace('dev0-', '')
        console.log(
          `📨 Message from ${projectName}:`,
          messageType,
          event.data.data
        )

        if (messageType === 'app-ready') {
          console.log('🎉 App is ready!', event.data.data)
        } else if (messageType === 'color-change') {
          console.log('🌈 Color changed to:', event.data.data.color)
        } else if (messageType === 'request-parent-action') {
          console.log('🎯 Parent action requested:', event.data.data)
        }
        return
      }

      if (
        event.data.type === 'screenshot' &&
        event.data.projectName === projectName
      ) {
        try {
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
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
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
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div
            style={{
              textAlign: 'center',
              color: '#e5e5e5',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Failed to load {projectName}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#a3a3a3',
              }}
            >
              The project at port {port} is not responding
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div
                style={{
                  fontSize: '13px',
                  color: '#a3a3a3',
                }}
              >
                Retrying in 2 seconds...
              </div>
            </div>
            {retryCount > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#737373',
                }}
              >
                Retry attempt {retryCount}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && !hasLoaded && !hasError && (
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
      {hasLoaded && !hasError && (
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
          // Clear any existing retry interval
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current)
            retryIntervalRef.current = null
          }

          // Add a small delay to ensure the iframe content is rendered
          setTimeout(() => {
            setHasLoaded(true)
            setHasError(false)
            setTimeout(() => {
              setIsLoading(false)
            }, 300)
          }, 100)
        }}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
          setHasLoaded(false)
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          borderBottomLeftRadius: 'var(--rounded-lg)',
          borderBottomRightRadius: 'var(--rounded-lg)',
          opacity: hasLoaded && !hasError ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          display: hasError ? 'none' : 'block',
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
