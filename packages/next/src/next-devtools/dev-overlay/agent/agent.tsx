import { useState, useEffect, useCallback, use, Suspense } from 'react'
import { parseStack } from '../../../server/lib/parse-stack'
import { getOriginalStackFrames } from '../../shared/stack-frame'

export function Agent() {
  const [isLocatorActive, setIsLocatorActive] = useState(false)
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)

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
        setSelectedElement(target)
        setIsLocatorActive(false)
        console.log('Selected element:', target)
      }
    },
    [isLocatorActive]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isLocatorActive) {
        setIsLocatorActive(false)
        setSelectedElement(null)
      }
    },
    [isLocatorActive]
  )

  useEffect(() => {
    if (isLocatorActive) {
      document.addEventListener('click', handleClick, true)
      document.addEventListener('keydown', handleKeyDown)

      // this should take most precedence, even over link hover
      document.body.style.setProperty('cursor', 'crosshair', 'important')

      return () => {
        document.removeEventListener('click', handleClick, true)
        document.removeEventListener('keydown', handleKeyDown)
        // TODO: what if the body had an existing cursor style?
        document.body.style.removeProperty('cursor')
      }
    }
  }, [isLocatorActive, handleClick, handleKeyDown])

  return (
    <div style={{ padding: '16px', color: 'var(--color-gray-1000)' }}>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => {
            setIsLocatorActive(!isLocatorActive)
            setSelectedElement(null)
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: isLocatorActive
              ? 'var(--color-blue-700)'
              : 'var(--color-gray-100)',
            color: isLocatorActive ? 'white' : 'var(--color-gray-1000)',
            border: '1px solid var(--color-gray-alpha-400)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {isLocatorActive ? 'Stop Locating (ESC)' : 'Start Locating'}
        </button>
        {isLocatorActive && (
          <p
            style={{
              margin: '8px 0',
              fontSize: '12px',
              color: 'var(--color-gray-700)',
            }}
          >
            Click on any element to select it. Press ESC to cancel.
          </p>
        )}
      </div>

      {selectedElement && <div>Selected a element</div>}
      {selectedElement && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Selected Element Properties:
          </h4>
          <ul
            style={{
              fontSize: '13px',
              color: 'var(--color-gray-900)',
              paddingLeft: '16px',
            }}
          >
            <SourceMappedStack fiber={getFiberFromElement(selectedElement)} />
          </ul>
        </div>
      )}
    </div>
  )
}

type Fiber = object & { __brand__: 'Fiber' }

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

function getOwnerFiber(fiber: Fiber): Fiber | null {
  // React internal: _debugOwner points to the owner fiber, if available
  if (fiber && typeof fiber === 'object' && '_debugOwner' in fiber) {
    const owner = (fiber as any)._debugOwner
    if (owner && typeof owner === 'object') {
      return owner as Fiber
    }
  }
  return null
}

const SourceMappedStack = ({ fiber }: { fiber: Fiber | null }) => {
  if (!fiber) {
    throw new Error('Cannot find fiber from element')
  }
  const debugStack = getDebugStackFromFiber(fiber)
  if (!debugStack) {
    throw new Error('No debug stack from fiber')
  }
  const frames = parseStack(debugStack)

  // TODO: should be wrapped with cached promise
  const promise = getOriginalStackFrames(frames, null, true)
  return (
    <Suspense fallback={<div>Loading Stack...</div>}>
      <SourceMappedStackImpl fetchPromise={promise} />
      <ButtonToLoadSourceMappedStackFromParent fiber={fiber} />
    </Suspense>
  )
}

const SourceMappedStackImpl = ({
  fetchPromise,
}: {
  fetchPromise: ReturnType<typeof getOriginalStackFrames>
}) => {
  const mappedFrames = use(fetchPromise)
  console.log('mappedFrames', mappedFrames)
  const readableFrames = mappedFrames
    .filter((frame) => !frame.ignored)
    .map((frame) => {
      const original = frame.originalStackFrame || frame.sourceStackFrame
      return `    at ${original.methodName} (${original.file}:${original.line1}:${original.column1})`
    })
    .join('\n')
  if (readableFrames.length === 0) {
    return <div>No non-ignored frames found</div>
  }
  return (
    <div>
      <pre>{readableFrames}</pre>
    </div>
  )
}

const ButtonToLoadSourceMappedStackFromParent = ({
  fiber,
}: {
  fiber: Fiber
}) => {
  const [shouldLoad, setShouldLoad] = useState(false)

  if (shouldLoad) {
    return <LoadSourceMappedStackFromParent fiber={fiber} />
  }

  return (
    <div style={{ marginTop: 16, textAlign: 'center' }}>
      <button
        type="button"
        onClick={() => setShouldLoad(true)}
        style={{
          padding: '8px 16px',
          background: 'var(--color-blue-700, #2563eb)',
          color: 'var(--color-white, #fff)',
          border: 'none',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'background 0.2s',
        }}
      >
        Load parent
      </button>
    </div>
  )
}

const LoadSourceMappedStackFromParent = ({ fiber }: { fiber: Fiber }) => {
  const owner = getOwnerFiber(fiber)
  console.log('owner', owner)

  return (
    <div
      style={{
        marginTop: 16,
        padding: '12px 16px',
        background: 'var(--color-gray-100, #f3f4f6)',
        borderRadius: 4,
        color: 'var(--color-gray-900, #111827)',
        fontSize: 14,
        textAlign: 'center',
        border: '1px solid var(--color-gray-200, #e5e7eb)',
      }}
    >
      <SourceMappedStack fiber={owner} />
    </div>
  )
}
