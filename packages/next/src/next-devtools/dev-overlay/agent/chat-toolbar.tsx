import { useState, useEffect, useCallback } from 'react'
import { parseStack } from '../../../server/lib/parse-stack'
import { getOriginalStackFrames } from '../../shared/stack-frame'
import './chat-interface.css'

interface ChatToolbarProps {
  onElementSelected?: (sourcePath: string) => void
}

type Fiber = object & { __brand__: 'Fiber' }

export function ChatToolbar({ onElementSelected }: ChatToolbarProps) {
  const [isLocatorActive, setIsLocatorActive] = useState(false)

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isLocatorActive) return

      event.preventDefault()
      event.stopPropagation()

      const target = event.target as HTMLElement
      if (
        target &&
        target !== document.body &&
        target !== document.documentElement
      ) {
        setIsLocatorActive(false)

        // Extract source path from the element
        console.log('🐛 DEBUG: Element clicked:', target)
        const fiber = getFiberFromElement(target)
        console.log('🐛 DEBUG: Fiber extracted:', fiber)
        if (fiber) {
          extractSourcePath(fiber).then((sourcePath) => {
            console.log('🐛 DEBUG: Source path extracted:', sourcePath)
            if (sourcePath && onElementSelected) {
              onElementSelected(sourcePath)
            }
          })
        } else {
          console.log('🐛 DEBUG: No fiber found for element')
        }
      }
    },
    [isLocatorActive, onElementSelected]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isLocatorActive) {
        setIsLocatorActive(false)
      }
    },
    [isLocatorActive]
  )

  useEffect(() => {
    if (isLocatorActive) {
      document.addEventListener('click', handleClick, true)
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.setProperty('cursor', 'crosshair', 'important')

      return () => {
        document.removeEventListener('click', handleClick, true)
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.removeProperty('cursor')
      }
    }
  }, [isLocatorActive, handleClick, handleKeyDown])

  return (
    <div className="chatToolbar">
      <button
        type="button"
        onClick={() => setIsLocatorActive(!isLocatorActive)}
        className={`toolbarButton ${isLocatorActive ? 'active' : ''}`}
        aria-label={
          isLocatorActive ? 'Stop locating elements' : 'Start locating elements'
        }
        title={
          isLocatorActive
            ? 'Click ESC or this button to stop'
            : 'Click to select an element on the page'
        }
      >
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 0C8.55228 0 9 0.447715 9 1V4C9 4.55228 8.55228 5 8 5C7.44772 5 7 4.55228 7 4V1C7 0.447715 7.44772 0 8 0ZM8 11C8.55228 11 9 11.4477 9 12V15C9 15.5523 8.55228 16 8 16C7.44772 16 7 15.5523 7 15V12C7 11.4477 7.44772 11 8 11ZM16 8C16 8.55228 15.5523 9 15 9H12C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7H15C15.5523 7 16 7.44772 16 8ZM5 8C5 8.55228 4.55228 9 4 9H1C0.447715 9 0 8.55228 0 8C0 7.44772 0.447715 7 1 7H4C4.55228 7 5 7.44772 5 8Z"
            fill="currentColor"
          />
        </svg>
        {isLocatorActive ? 'Stop' : 'Locate'}
      </button>
      {isLocatorActive && (
        <span className="locatorInstructions">
          Click any element to select it (ESC to cancel)
        </span>
      )}
    </div>
  )
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

const getOwnerFiber = (fiber: Fiber): Fiber | null => {
  if (fiber && typeof fiber === 'object' && '_debugOwner' in fiber) {
    const owner = (fiber as any)._debugOwner
    if (owner && typeof owner === 'object') {
      return owner as Fiber
    }
  }
  return null
}

const extractSourcePath = async (fiber: Fiber): Promise<string | null> => {
  const debugStack = getDebugStackFromFiber(fiber)
  if (!debugStack) {
    // Try parent fiber if current doesn't have debug stack
    const owner = getOwnerFiber(fiber)
    if (owner) {
      return extractSourcePath(owner)
    }
    return null
  }

  const frames = parseStack(debugStack)

  try {
    // Use normal fetch instead of React.use
    const mappedFrames = await getOriginalStackFrames(frames, null, true)
    const validFrames = mappedFrames.filter((frame) => !frame.ignored)

    if (validFrames.length > 0) {
      const firstFrame = validFrames[0]
      const original =
        firstFrame.originalStackFrame || firstFrame.sourceStackFrame
      return `${original.file}:${original.line1}:${original.column1}`
    }

    // If no valid frames, try parent
    const owner = getOwnerFiber(fiber)
    if (owner) {
      return extractSourcePath(owner)
    }

    return null
  } catch (error) {
    console.warn('Failed to resolve source path:', error)
    // Try parent on error
    const owner = getOwnerFiber(fiber)
    if (owner) {
      return extractSourcePath(owner)
    }
    return null
  }
}
