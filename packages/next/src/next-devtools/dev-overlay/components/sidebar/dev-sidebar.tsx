import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSidebarContext } from '../../context/sidebar-context'

export const DevSidebar = () => {
  const { isOpen, width, setWidth, closeSidebar } = useSidebarContext()
  const [isResizing, setIsResizing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  
  // Generate persistent session ID for this devtools instance
  const [terminalSessionId] = useState(() => {
    // Try to get existing session from localStorage or create new one
    const existing = localStorage.getItem('devtools-terminal-session')
    if (existing) {
      return existing
    }
    const newSession = `devtools-session-${Date.now()}`
    localStorage.setItem('devtools-terminal-session', newSession)
    return newSession
  })

  // Find or create a container near the root of the page for the portal
  useEffect(() => {
    let container = document.getElementById('__next-dev-sidebar-portal')
    if (!container) {
      container = document.createElement('div')
      container.id = '__next-dev-sidebar-portal'
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.pointerEvents = 'none'
      container.style.zIndex = '9999'
      
      // Insert at the beginning of body to be near the root
      document.body.insertBefore(container, document.body.firstChild)
    }
    setPortalContainer(container)

    return () => {
      // Clean up on unmount
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, [])

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 200 && newWidth <= 800) {
        setWidth(newWidth)
        
        // Update the page layout
        const body = document.body
        if (body) {
          body.style.marginRight = isOpen ? `${newWidth}px` : '0'
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setWidth, isOpen])

  // Update page layout when sidebar opens/closes
  useEffect(() => {
    const body = document.body
    if (body) {
      body.style.transition = isResizing ? 'none' : 'margin-right 0.3s ease'
      body.style.marginRight = isOpen ? `${width}px` : '0'
    }

    return () => {
      // Cleanup on unmount
      if (body) {
        body.style.marginRight = '0'
        body.style.transition = ''
      }
    }
  }, [isOpen, width, isResizing])

  // Handle forwarded mouse events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle forwarded mouse events from terminal iframe
      if (event.data.type === 'iframe-mouse-event') {
        const { eventType, clientX, clientY, button, buttons } = event.data
        
        // Create and dispatch a synthetic mouse event on the parent document
        const syntheticEvent = new MouseEvent(eventType, {
          clientX,
          clientY,
          button,
          buttons,
          bubbles: true,
          cancelable: true
        })
        
        document.dispatchEvent(syntheticEvent)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  if (!portalContainer || !isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: `${width}px`,
        height: '100vh',
        backgroundColor: '#000',
        pointerEvents: 'auto',
        fontFamily: 'var(--font-stack-sans)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        transition: isResizing ? 'none' : 'transform 0.3s ease',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      {/* Subtle left border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}
      />
      
      {/* Terminal content */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        backgroundColor: '#000',
      }}>
        <iframe
          ref={iframeRef}
          src={`http://localhost:4262?session=${encodeURIComponent(terminalSessionId)}&cwd=${encodeURIComponent('/Users/robby')}&shell=${encodeURIComponent('/bin/zsh')}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000',
          }}
          title="Terminal"
        />
        
        {/* Transparent overlay to block iframe during resize */}
        {isResizing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 9999,
              background: 'transparent',
              cursor: 'ew-resize',
            }}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '100%',
          cursor: 'ew-resize',
          backgroundColor: 'transparent',
          zIndex: 20,
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      />
    </div>,
    portalContainer
  )
}