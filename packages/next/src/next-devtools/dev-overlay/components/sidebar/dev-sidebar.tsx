import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSidebarContext } from '../../context/sidebar-context'
import { ProjectTerminalManager } from '../terminal/project-terminal'

export const DevSidebar = () => {
  const { isOpen, width, setWidth, closeSidebar } = useSidebarContext()
  const [isResizing, setIsResizing] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const resizeRef = useRef<HTMLDivElement>(null)

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX)
      // Limit the width between 200 and 800 pixels
      const clampedWidth = Math.max(200, Math.min(800, newWidth))
      setWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
        }}
      >
        <ProjectTerminalManager />

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
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10px',
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 20,
          background: 'transparent',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      />

      {/* Visual resize indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '3px',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '40px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none',
          opacity: isResizing ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>,
    portalContainer
  )
}
