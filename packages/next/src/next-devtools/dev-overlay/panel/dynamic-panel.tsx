import { useMemo, useRef, useState, useEffect, useLayoutEffect, type CSSProperties } from 'react'
import { useDevOverlayContext } from '../../dev-overlay.browser'
import { INDICATOR_PADDING } from '../components/devtools-indicator/devtools-indicator'
import { useSidebarContext } from '../context/sidebar-context'
import { ResizeHandle } from '../components/devtools-panel/resize/resize-handle'
import { ResizeProvider } from '../components/devtools-panel/resize/resize-provider'
import {
  DragHandle,
  DragProvider,
} from '../components/errors/dev-tools-indicator/drag-context'
import { Draggable } from '../components/errors/dev-tools-indicator/draggable'
import { useClickOutsideAndEscape } from '../components/errors/dev-tools-indicator/utils'
import { usePanelRouterContext, type PanelStateKind } from '../menu/context'
import { usePanelContext } from '../menu/panel-router'
import {
  ACTION_DEVTOOLS_PANEL_POSITION,
  STORAGE_KEY_PANEL_POSITION_PREFIX,
  STORE_KEY_PANEL_SIZE_PREFIX,
  STORE_KEY_SHARED_PANEL_LOCATION,
  STORE_KEY_SHARED_PANEL_SIZE,
} from '../shared'
import { getIndicatorOffset } from '../utils/indicator-metrics'

function resolveCSSValue(
  value: string | number,
  dimension: 'width' | 'height' = 'width'
): number {
  if (typeof value === 'number') return value

  // kinda hacky, might be a better way to do this
  const temp = document.createElement('div')
  temp.style.position = 'absolute'
  temp.style.visibility = 'hidden'
  if (dimension === 'width') {
    temp.style.width = value
  } else {
    temp.style.height = value
  }
  document.body.appendChild(temp)
  const pixels = dimension === 'width' ? temp.offsetWidth : temp.offsetHeight
  document.body.removeChild(temp)
  return pixels
}

function useResolvedDimensions(
  minWidth?: string | number,
  minHeight?: string | number,
  maxWidth?: string | number,
  maxHeight?: string | number
) {
  const [dimensions, setDimensions] = useState(() => ({
    minWidth: minWidth ? resolveCSSValue(minWidth, 'width') : undefined,
    minHeight: minHeight ? resolveCSSValue(minHeight, 'height') : undefined,
    maxWidth: maxWidth ? resolveCSSValue(maxWidth, 'width') : undefined,
    maxHeight: maxHeight ? resolveCSSValue(maxHeight, 'height') : undefined,
  }))

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        minWidth: minWidth ? resolveCSSValue(minWidth, 'width') : undefined,
        minHeight: minHeight ? resolveCSSValue(minHeight, 'height') : undefined,
        maxWidth: maxWidth ? resolveCSSValue(maxWidth, 'width') : undefined,
        maxHeight: maxHeight ? resolveCSSValue(maxHeight, 'height') : undefined,
      })
    }

    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [minWidth, minHeight, maxWidth, maxHeight])

  return dimensions
}

function getStoredPanelSize(panelName?: string) {
  const key = panelName
    ? `${STORE_KEY_PANEL_SIZE_PREFIX}_${panelName}`
    : STORE_KEY_SHARED_PANEL_SIZE
  const defaultSize = { width: 450, height: 350 }
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!stored) {
      return defaultSize
    }
    if (
      typeof stored === 'object' &&
      'height' in stored &&
      'width' in stored &&
      typeof stored.height === 'number' &&
      typeof stored.width === 'number'
    ) {
      return {
        width: stored.width as number,
        height: stored.height as number,
      }
    }
    return null
  } catch {
    return null
  }
}

export function DynamicPanel({
  header,
  children,
  draggable = false,
  sizeConfig = {
    kind: 'resizable',
    minWidth: 400,
    minHeight: 350,
    maxWidth: 1000,
    maxHeight: 1000,
    initialSize: {
      height: 400,
      width: 500,
    },
  },
  closeOnClickOutside = false,
  sharePanelSizeGlobally = true,
  sharePanelPositionGlobally = true,
  containerProps,
}: {
  header: React.ReactNode
  children: React.ReactNode
  draggable?: boolean
  sharePanelSizeGlobally?: boolean
  sharePanelPositionGlobally?: boolean
  containerProps?: React.HTMLProps<HTMLDivElement>
  sizeConfig?:
    | {
        kind: 'resizable'
        minWidth: string | number
        minHeight: string | number
        maxWidth: string | number
        maxHeight: string | number
        initialSize: { height: number; width: number }
        sides?: Array<'horizontal' | 'vertical' | 'diagonal'>
      }
    | {
        kind: 'fixed'
        height: number
        width: number
      }
  closeOnClickOutside?: boolean
}) {
  const { closePanel, triggerRef, panels, bringPanelToFront, getPanelZIndex } = usePanelRouterContext()
  const { name, mounted } = usePanelContext()
  const resizeStorageKey = sharePanelSizeGlobally
    ? STORE_KEY_SHARED_PANEL_SIZE
    : `${STORE_KEY_PANEL_SIZE_PREFIX}_${name}`

  const positionStorageKey = sharePanelPositionGlobally
    ? STORE_KEY_SHARED_PANEL_LOCATION
    : `${STORAGE_KEY_PANEL_POSITION_PREFIX}_${name}`

  const { dispatch, state } = useDevOverlayContext()
  const { isOpen: sidebarIsOpen, width: sidebarWidth } = useSidebarContext()
  const devtoolsPanelPosition =
    state.devToolsPanelPosition[positionStorageKey] ?? state.devToolsPosition
  const [panelVertical, panelHorizontal] = devtoolsPanelPosition.split('-', 2)
  const resizeContainerRef = useRef<HTMLDivElement>(null)

  useClickOutsideAndEscape(
    resizeContainerRef,
    triggerRef,
    mounted,
    (reason) => {
      switch (reason) {
        case 'escape': {
          // Escape is handled by our custom handler above
          return
        }
        case 'outside': {
          if (closeOnClickOutside) {
            closePanel(name as PanelStateKind)
          }
          return
        }
        default: {
          return null!
        }
      }
    }
  )

  const indicatorOffset = getIndicatorOffset(state)

  const [indicatorVertical, indicatorHorizontal] = state.devToolsPosition.split(
    '-',
    2
  )

  const verticalOffset =
    panelVertical === indicatorVertical &&
    panelHorizontal === indicatorHorizontal
      ? indicatorOffset
      : INDICATOR_PADDING

  // Calculate horizontal offset considering sidebar
  const sidebarOffset = sidebarIsOpen ? sidebarWidth : 0
  const horizontalOffset = panelHorizontal === 'right' && sidebarIsOpen 
    ? INDICATOR_PADDING + sidebarOffset 
    : INDICATOR_PADDING

  // Check if command palette is open
  const isCommandPaletteOpen = panels.has('panel-selector' as PanelStateKind)
  
  // Adjust position if command palette is open and panel would overlap
  let adjustedVerticalOffset = verticalOffset
  let adjustedHorizontalOffset = horizontalOffset
  
  if (isCommandPaletteOpen && panelVertical === 'bottom' && panelHorizontal === 'left') {
    // Move panel to avoid command palette (320px width + 20px padding + 20px spacing)
    adjustedHorizontalOffset = Math.max(horizontalOffset, 360)
    // Also ensure panel is above command palette (480px max height + 60px bottom offset)
    adjustedVerticalOffset = Math.max(verticalOffset, 80)
  }

  const positionStyle = {
    [panelVertical]: `${adjustedVerticalOffset}px`,
    [panelHorizontal]: `${adjustedHorizontalOffset}px`,
    [panelVertical === 'top' ? 'bottom' : 'top']: 'auto',
    [panelHorizontal === 'left' ? 'right' : 'left']: 'auto',
  } as CSSProperties

  const isResizable = sizeConfig.kind === 'resizable'

  const resolvedDimensions = useResolvedDimensions(
    isResizable ? sizeConfig.minWidth : undefined,
    isResizable ? sizeConfig.minHeight : undefined,
    isResizable ? sizeConfig.maxWidth : undefined,
    isResizable ? sizeConfig.maxHeight : undefined
  )

  const minWidth = resolvedDimensions.minWidth
  const minHeight = resolvedDimensions.minHeight
  const maxWidth = resolvedDimensions.maxWidth
  const maxHeight = resolvedDimensions.maxHeight

  const panelSize = useMemo(() => getStoredPanelSize(name), [name])
  
  // Calculate z-index outside of style object to ensure it updates
  const zIndex = getPanelZIndex(name)

  // Focus panel when it mounts to ensure escape key closes panel first
  useLayoutEffect(() => {
    if (mounted && resizeContainerRef.current) {
      // Small delay to ensure panel is fully rendered
      setTimeout(() => {
        resizeContainerRef.current?.focus()
        bringPanelToFront(name)
      }, 50)
    }
  }, [mounted, bringPanelToFront, name])

  // Handle escape key with proper event capturing
  useEffect(() => {
    if (!mounted) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && resizeContainerRef.current) {
        // Check if this panel or its children have focus
        const hasFocus = document.activeElement === resizeContainerRef.current || 
                        resizeContainerRef.current.contains(document.activeElement)
        
        if (hasFocus) {
          e.stopPropagation()
          e.preventDefault()
          closePanel(name as PanelStateKind)
          
          // Check if this was the last panel (besides command palette)
          const remainingPanels = Array.from(panels).filter(p => p !== name && p !== 'panel-selector')
          
          // If command palette is open and this was the last other panel, focus it
          if (panels.has('panel-selector' as PanelStateKind) && remainingPanels.length === 0) {
            setTimeout(() => {
              const commandPalette = document.getElementById('nextjs-command-palette')
              if (commandPalette) {
                commandPalette.focus()
                // Also focus the search input
                const searchInput = commandPalette.querySelector('input')
                searchInput?.focus()
              }
            }, 50)
          }
        }
      }
    }

    // Use capture phase to handle event before it bubbles
    document.addEventListener('keydown', handleEscape, true)
    
    return () => {
      document.removeEventListener('keydown', handleEscape, true)
    }
  }, [mounted, closePanel, name, panels])

  return (
    <ResizeProvider
      value={{
        resizeRef: resizeContainerRef,
        initialSize:
          sizeConfig.kind === 'resizable' ? sizeConfig.initialSize : sizeConfig,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        devToolsPosition: state.devToolsPosition,
        storageKey: resizeStorageKey,
      }}
    >
      <div
        tabIndex={-1}
        ref={resizeContainerRef}
        onMouseDown={() => bringPanelToFront(name)}
        style={{
          position: 'fixed',
          zIndex: zIndex,
          outline: 'none',
          ...positionStyle,
          ...(isResizable
            ? {
                minWidth,
                minHeight,
                maxWidth,
                maxHeight,
              }
            : {
                height: panelSize ? panelSize.height : sizeConfig.height,
                width: panelSize ? panelSize.width : sizeConfig.width,
              }),
        }}
      >
        <DragProvider disabled={!draggable}>
          <Draggable
            dragHandleSelector=".resize-container"
            avoidZone={{
              corner: panels.has('panel-selector' as PanelStateKind) ? 'bottom-left' : state.devToolsPosition,
              square: panels.has('panel-selector' as PanelStateKind) ? 360 : 25 / state.scale,
              padding: INDICATOR_PADDING,
            }}
            padding={INDICATOR_PADDING}
            position={devtoolsPanelPosition}
            setPosition={(p) => {
              if (sizeConfig.kind === 'resizable') {
                localStorage.setItem(positionStorageKey, p)
              }
              dispatch({
                type: ACTION_DEVTOOLS_PANEL_POSITION,
                devToolsPanelPosition: p,
                key: positionStorageKey,
              })
            }}
            style={{
              overflow: 'auto',
              width: '100%',
              height: '100%',
            }}
            disableDrag={!draggable}
          >
            <>
              <div
                {...containerProps}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  border: '1px solid var(--color-gray-alpha-400)',
                  borderRadius: 'var(--rounded-xl)',
                  background: 'var(--color-background-100)',
                  display: 'flex',
                  flexDirection: 'column',
                  ...containerProps?.style,
                }}
              >
                <DragHandle>{header}</DragHandle>
                <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
              </div>
              {isResizable && (
                <>
                  {(!sizeConfig.sides ||
                    sizeConfig.sides.includes('vertical')) && (
                    <>
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="top"
                      />
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="bottom"
                      />
                    </>
                  )}
                  {(!sizeConfig.sides ||
                    sizeConfig.sides.includes('horizontal')) && (
                    <>
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="right"
                      />
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="left"
                      />
                    </>
                  )}
                  {(!sizeConfig.sides ||
                    sizeConfig.sides.includes('diagonal')) && (
                    <>
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="top-left"
                      />
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="top-right"
                      />
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="bottom-left"
                      />
                      <ResizeHandle
                        position={devtoolsPanelPosition}
                        direction="bottom-right"
                      />
                    </>
                  )}
                </>
              )}
            </>
          </Draggable>
        </DragProvider>
      </div>
    </ResizeProvider>
  )
}
