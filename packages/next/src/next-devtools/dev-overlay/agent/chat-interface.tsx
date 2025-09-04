import { useState, useEffect } from 'react'
import { ChatHeader } from './chat-header'
import { ChatMessage, type Message } from './chat-message'
import { ChatInput } from './chat-input'
import { parseStack } from '../../../server/lib/parse-stack'
import { getOriginalStackFrames } from '../../shared/stack-frame'
import './chat-interface.css'

// Codice editor import
import { Editor } from 'codice'

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Change this button to blue',
    role: 'user',
    timestamp: new Date(),
  },
  {
    id: '2',
    content: 'Done!',
    role: 'assistant',
    timestamp: new Date(),
  },
]

type Fiber = object & { __brand__: 'Fiber' }

interface InspectableComponent {
  element: Element
  fiber: Fiber
  componentName?: string
}

interface SourceLocation {
  file: string
  line: number
  column: number
  methodName: string
}

const getFiberFromElement = (element: Element): Fiber | null => {
  const fiberKey = Object.keys(element).find((key) =>
    key.startsWith('__reactFiber')
  )
  if (!fiberKey) return null

  type ElementWithFiber = Element & { [key: string]: unknown }
  const elWithFiber = element as ElementWithFiber
  const fiber = elWithFiber[fiberKey]
  if (fiber && typeof fiber === 'object') {
    return fiber as Fiber
  }

  return null
}

const getComponentName = (fiber: Fiber): string | undefined => {
  if (fiber && typeof fiber === 'object') {
    const fiberAny = fiber as any
    if (fiberAny.type) {
      if (typeof fiberAny.type === 'string') {
        return fiberAny.type
      }
      if (typeof fiberAny.type === 'function') {
        return fiberAny.type.name || fiberAny.type.displayName
      }
    }
  }
  return undefined
}

const getDebugStackFromFiber = (fiber: Fiber): string | null => {
  if (
    fiber &&
    typeof fiber === 'object' &&
    '_debugStack' in fiber &&
    fiber._debugStack &&
    typeof (fiber as { _debugStack: unknown })._debugStack === 'object' &&
    'stack' in (fiber as { _debugStack: { stack?: unknown } })._debugStack
  ) {
    const stack = (fiber as { _debugStack: { stack?: unknown } })._debugStack
      .stack
    return typeof stack === 'string' ? stack : null
  }
  return null
}

const getSourceLocationFromFiber = async (
  fiber: Fiber
): Promise<SourceLocation | null> => {
  const debugStack = getDebugStackFromFiber(fiber)
  if (!debugStack) return null

  try {
    const frames = parseStack(debugStack)
    const mappedFrames = await getOriginalStackFrames(frames, null, true)

    const readableFrame = mappedFrames.find((frame) => !frame.ignored)
    if (readableFrame) {
      const original =
        readableFrame.originalStackFrame || readableFrame.sourceStackFrame
      return {
        file: original.file || '',
        line: original.line1 || 0,
        column: original.column1 || 0,
        methodName: original.methodName || 'unknown',
      }
    }
  } catch (error) {
    // Failed to get source location
  }

  return null
}

const findInspectableComponents = (): InspectableComponent[] => {
  const components: InspectableComponent[] = []
  const visited = new Set<Element>()

  const processElement = (element: Element) => {
    if (visited.has(element)) return
    visited.add(element)

    const fiber = getFiberFromElement(element)
    if (fiber) {
      const componentName = getComponentName(fiber)
      // Include both React components and HTML elements with React fibers
      if (componentName) {
        // Filter out some common non-useful components
        const excludeNames = ['Fragment', 'Suspense', 'ErrorBoundary']
        if (!excludeNames.includes(componentName)) {
          components.push({
            element,
            fiber,
            componentName,
          })
        }
      }
    }
  }

  // Use querySelectorAll to find all elements, then check each one
  const allElements = document.querySelectorAll('*')
  allElements.forEach(processElement)

  // Also check the document.body itself
  processElement(document.body)

  return components
}

interface ChatInterfaceProps {
  onClose?: () => void
}

// Codice Editor wrapper component
const CodeEditorWrapper = ({
  value,
  title,
  height,
  width,
  onChange,
}: {
  value: string
  title: string
  height: number
  width: number
  onChange?: (newCode: string) => void
}) => {
  const handleChange = onChange || (() => {})

  return (
    <div
      style={{
        height,
        width,
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <style>
        {`
          [data-codice-header] {
            display: none !important;
          }
        `}
      </style>
      <Editor
        fontSize={12}
        value={value}
        title={title}
        onChange={handleChange as any}
        onChangeTitle={() => {}} // Don't allow title changes in inspector
      />
    </div>
  )
}

interface InspectorInfo {
  componentName: string
  sourceLocation: SourceLocation | null
  fiber: Fiber
}

function MiniEditor({
  sourceLocation,
  onClose,
}: {
  sourceLocation: SourceLocation
  onClose: () => void
}) {
  const [sourceCode, setSourceCode] = useState<string>('Loading...')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSourceCode = async () => {
      try {
        setIsLoading(true)

        // Use the new Next.js devtools source code API
        const response = await fetch(
          `/__nextjs_source_code?file=${encodeURIComponent(sourceLocation.file)}`
        )

        if (response.ok) {
          const code = await response.text()
          setSourceCode(code)
        } else {
          throw new Error(
            `Failed to fetch source code: ${response.status} ${response.statusText}`
          )
        }
      } catch (error) {
        setSourceCode(`// Unable to load source code from: ${sourceLocation.file}
// Error: ${error instanceof Error ? error.message : 'Unknown error'}
//
// File: ${sourceLocation.file}
// Line: ${sourceLocation.line}:${sourceLocation.column}
// Component: ${sourceLocation.methodName}
//
// This could be due to:
// - File not found in the project directory
// - File outside of project scope
// - Development server not running`)
      } finally {
        setIsLoading(false)
      }
    }

    loadSourceCode()
  }, [sourceLocation])

  const handleCodeChange = (newCode: string) => {
    setSourceCode(newCode)
    // TODO: Implement auto-save or save on demand
    console.log('Code changed:', newCode)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '400px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <div>
          {/* <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
            {sourceLocation.file.split('/').pop()}
          </div> */}
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            {sourceLocation.file} • Line {sourceLocation.line}:
            {sourceLocation.column}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '6px',
            color: '#6b7280',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.color = '#374151'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Loading source code...
          </div>
        ) : (
          <CodeEditorWrapper
            value={sourceCode}
            title={sourceLocation.file.split('/').pop() || 'Unknown'}
            height={330}
            width={500}
            onChange={handleCodeChange}
          />
        )}
      </div>
    </div>
  )
}

function InspectOverlay() {
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    display: 'none',
  })
  const [selectedOverlayStyle, setSelectedOverlayStyle] =
    useState<React.CSSProperties>({ display: 'none' })
  const [inspectorInfo, setInspectorInfo] = useState<InspectorInfo | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<InspectorInfo | null>(null)
  const [showMiniEditor, setShowMiniEditor] = useState(false)

  useEffect(() => {
    let currentComponents: InspectableComponent[] = []

    const updateComponents = () => {
      currentComponents = findInspectableComponents()
    }

    // Initial scan
    updateComponents()

    const findComponentForElement = (
      element: Element
    ): InspectableComponent | null => {
      return currentComponents.find((comp) => comp.element === element) || null
    }

    const handleMouseMove = async (e: MouseEvent) => {
      const target = e.target as Element

      // Find the closest inspectable component
      let foundComponent: InspectableComponent | null = null

      // First try exact match
      foundComponent = findComponentForElement(target)

      // If not found, try parent traversal
      if (!foundComponent) {
        let currentElement: Element | null = target
        while (currentElement && currentElement !== document.body) {
          foundComponent = findComponentForElement(currentElement)
          if (foundComponent) break
          currentElement = currentElement.parentElement
        }
      }

      if (foundComponent) {
        const rect = foundComponent.element.getBoundingClientRect()
        setOverlayStyle({
          display: 'block',
          position: 'fixed',
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointerEvents: 'none',
          zIndex: 999999,
          borderRadius: '4px',
          boxSizing: 'border-box',
        })

        // Get source location asynchronously
        const sourceLocation = await getSourceLocationFromFiber(
          foundComponent.fiber
        )
        setInspectorInfo({
          componentName: foundComponent.componentName || 'Unknown Component',
          sourceLocation,
          fiber: foundComponent.fiber,
        })
      } else {
        setOverlayStyle({ display: 'none' })
        setInspectorInfo(null)
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (inspectorInfo) {
        e.preventDefault()
        e.stopPropagation()

        // Pin/select the current component
        setSelectedInfo(inspectorInfo)

        // Create persistent overlay for selected component
        const target = e.target as Element
        let foundComponent: InspectableComponent | null = null

        foundComponent = findComponentForElement(target)
        if (!foundComponent) {
          let currentElement: Element | null = target
          while (currentElement && currentElement !== document.body) {
            foundComponent = findComponentForElement(currentElement)
            if (foundComponent) break
            currentElement = currentElement.parentElement
          }
        }

        if (foundComponent) {
          const rect = foundComponent.element.getBoundingClientRect()
          setSelectedOverlayStyle({
            display: 'block',
            position: 'fixed',
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            border: '2px solid #10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            pointerEvents: 'none',
            zIndex: 999998,
            borderRadius: '4px',
            boxSizing: 'border-box',
          })
        }

        // Component selected for inspection
      }
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('click', handleClick, true)

    // Refresh components periodically in case DOM changes
    const refreshInterval = setInterval(updateComponents, 1000)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('click', handleClick, true)
      clearInterval(refreshInterval)
    }
  }, [inspectorInfo])

  return (
    <>
      {/* Hover overlay - blue highlight */}
      <div style={overlayStyle} />

      {/* Selected overlay - green highlight, persistent */}
      <div style={selectedOverlayStyle} />

      {/* Hover info - compact tooltip matching chat dialog style */}
      {inspectorInfo && !selectedInfo && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: '#ffffff',
            color: '#374151',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            zIndex: 1000000,
            pointerEvents: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div style={{ fontWeight: '500' }}>{inspectorInfo.componentName}</div>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>
            Click to select
          </div>
        </div>
      )}

      {/* Selected info - compact single row design matching chat dialog */}
      {selectedInfo && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#ffffff',
            color: '#000000',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 1000000,
            pointerEvents: 'auto',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '400px',
          }}
        >
          <div style={{ fontWeight: '500', color: '#374151' }}>
            {selectedInfo.componentName}
          </div>

          {selectedInfo.sourceLocation && (
            <>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {selectedInfo.sourceLocation.file.split('/').pop()}
              </div>

              <button
                onClick={() => setShowMiniEditor(true)}
                style={{
                  background: 'none',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontWeight: '400',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.color = '#6b7280'
                }}
                title="Open in editor"
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
                </svg>
                Edit
              </button>
            </>
          )}

          <button
            onClick={() => {
              setSelectedInfo(null)
              setSelectedOverlayStyle({ display: 'none' })
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '2px',
              marginLeft: 'auto',
              fontSize: '14px',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6b7280'
            }}
            title="Clear selection"
          >
            ×
          </button>
        </div>
      )}

      {showMiniEditor && selectedInfo?.sourceLocation && (
        <MiniEditor
          sourceLocation={selectedInfo.sourceLocation}
          onClose={() => setShowMiniEditor(false)}
        />
      )}
    </>
  )
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isInspecting, setIsInspecting] = useState(false)

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev)
  }

  const handleToggleInspect = () => {
    setIsInspecting((prev) => !prev)
  }

  const handleSubmitMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'd be happy to help! Could you provide more details about what you're trying to accomplish?",
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <>
      <div className={`chatContainer ${isMinimized ? 'minimized' : ''}`}>
        <ChatHeader
          onClose={onClose || (() => {})}
          onToggleMinimize={handleToggleMinimize}
          isMinimized={isMinimized}
          onToggleInspect={handleToggleInspect}
          isInspecting={isInspecting}
        />

        {!isMinimized && (
          <>
            <div className="chatContent">
              <div className="messagesContainer">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="messageGroup">
                    <div className="messageContent assistant">
                      <p style={{ margin: 0, color: '#9ca3af' }}>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ChatInput
              onSubmit={handleSubmitMessage}
              disabled={isLoading}
              placeholder="Ask a question..."
            />
          </>
        )}
      </div>

      {isInspecting && <InspectOverlay />}
    </>
  )
}
