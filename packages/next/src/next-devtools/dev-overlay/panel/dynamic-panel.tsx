import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
} from 'react'
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
import { getDockItemPosition } from '../components/dock/panel-dock'

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

const DOCK_WIDTH = 200 // Fixed width for docked panels
const DOCK_HEIGHT = 150 // Fixed height for docked panels
const DOCK_GAP = 12 // Gap between docked panels

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
  const {
    closePanel,
    triggerRef,
    panels,
    bringPanelToFront,
    getPanelZIndex,
    activePanel,
    dockedPanels,
    swapPanels,
  } = usePanelRouterContext()
  const { name, mounted } = usePanelContext()
  const resizeStorageKey = sharePanelSizeGlobally
    ? STORE_KEY_SHARED_PANEL_SIZE
    : `${STORE_KEY_PANEL_SIZE_PREFIX}_${name}`

  const positionStorageKey = sharePanelPositionGlobally
    ? STORE_KEY_SHARED_PANEL_LOCATION
    : `${STORAGE_KEY_PANEL_POSITION_PREFIX}_${name}`

  const { dispatch, state } = useDevOverlayContext()
  const { isOpen: sidebarIsOpen, width: sidebarWidth } = useSidebarContext()
  // Default to top-right to avoid menu overlap
  const devtoolsPanelPosition =
    state.devToolsPanelPosition[positionStorageKey] ?? 'top-right'
  const [panelVertical, panelHorizontal] = devtoolsPanelPosition.split('-', 2)
  const resizeContainerRef = useRef<HTMLDivElement>(null)

  // Check if this panel is docked
  const isDocked = dockedPanels.has(name)
  const isActive = activePanel === name

  // We'll handle dock rendering differently

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
  const horizontalOffset =
    panelHorizontal === 'right' && sidebarIsOpen
      ? INDICATOR_PADDING + sidebarOffset
      : INDICATOR_PADDING

  // Get dock position for this panel
  // Force recalculation when dockedPanels changes
  const dockPosition = useMemo(
    () => (isDocked ? getDockItemPosition(name, dockedPanels) : null),
    [isDocked, name, dockedPanels]
  )

  // Get stored panel size for resizable panels
  const panelSize = useMemo(() => getStoredPanelSize(name), [name])

  // Get actual dimensions
  // For fixed size panels, always use the configured size
  // For resizable panels, use stored size or fall back to initial/default size
  const actualWidth =
    sizeConfig.kind === 'fixed'
      ? sizeConfig.width
      : panelSize?.width || sizeConfig.initialSize?.width || 400
  const actualHeight =
    sizeConfig.kind === 'fixed'
      ? sizeConfig.height
      : panelSize?.height || sizeConfig.initialSize?.height || 300

  // No longer need complex transform calculation since we use direct positioning

  // Calculate the actual visual position for smooth transitions
  const getActualPosition = () => {
    if (isDocked && dockPosition) {
      // Defensive check to ensure we have valid dock position
      if (
        dockPosition.x === 0 &&
        dockPosition.y === 0 &&
        dockPosition.width === 0 &&
        dockPosition.height === 0
      ) {
        console.error(`❌ Invalid dock position for ${name}`, {
          dockPosition,
          dockedPanels: Array.from(dockedPanels),
        })
        // Fall back to active panel position
        return {
          left: window.innerWidth / 2 - actualWidth / 2,
          top: window.innerHeight / 2 - actualHeight / 2,
          transform: 'scale(1)',
        }
      }

      // DOCK POSITION MATH:
      // dockPosition.x = dock slot's left edge
      // dockPosition.y = dock slot's top edge
      // dockPosition.width = 52px (dock slot width)
      // dockPosition.height = 52px (dock slot height)

      const scale = Math.min(48 / actualWidth, 48 / actualHeight) // Scale to 48px (4px padding in 52px slot)

      // When scaled, panel dimensions become:
      const scaledWidth = actualWidth * scale
      const scaledHeight = actualHeight * scale

      // CENTER-BASED positioning to avoid transform-origin issues
      // Calculate where the center of the dock slot is
      const dockCenterX = dockPosition.x + dockPosition.width / 2
      const dockCenterY = dockPosition.y + dockPosition.height / 2

      // When we scale from center, the visual center of the scaled panel should align with dock center
      // Since transform-origin is center, we position the unscaled panel so its center aligns with dock center
      const panelLeft = dockCenterX - actualWidth / 2
      const panelTop = dockCenterY - actualHeight / 2

      // Calculate where the visual center will be after scaling
      const visualCenterX = panelLeft + actualWidth / 2
      const visualCenterY = panelTop + actualHeight / 2

      console.warn(`🧮 DOCK MATH for ${name}:`, {
        dockSlot: {
          x: dockPosition.x,
          y: dockPosition.y,
          w: dockPosition.width,
          h: dockPosition.height,
        },
        dockCenter: { x: dockCenterX, y: dockCenterY },
        scale,
        originalSize: { width: actualWidth, height: actualHeight },
        scaledSize: { width: scaledWidth, height: scaledHeight },
        panelPosition: { left: panelLeft, top: panelTop },
        panelCenter: { x: visualCenterX, y: visualCenterY },
        centerMatch: {
          x: Math.abs(visualCenterX - dockCenterX) < 0.1,
          y: Math.abs(visualCenterY - dockCenterY) < 0.1,
        },
        dockedPanels: Array.from(dockedPanels),
        totalDocked: dockedPanels.size,
      })

      return {
        left: panelLeft,
        top: panelTop,
        transform: `scale(${scale})`,
      }
    } else {
      // When active, also use center-based positioning for consistency
      let cornerX, cornerY

      if (panelHorizontal === 'left') {
        cornerX = horizontalOffset
      } else {
        cornerX = window.innerWidth - actualWidth - horizontalOffset
      }

      if (panelVertical === 'top') {
        cornerY = verticalOffset
      } else {
        cornerY = window.innerHeight - actualHeight - verticalOffset
      }

      return {
        left: cornerX,
        top: cornerY,
        transform: 'scale(1)',
      }
    }
  }

  // Position styles with smooth transitions
  const positionStyle = {
    ...getActualPosition(),
    transformOrigin: 'center center', // Scale from center to avoid positioning jumps
    opacity: isActive || isDocked ? 1 : 0,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: isActive || isDocked ? ('auto' as const) : ('none' as const),
    visibility:
      isActive || isDocked ? ('visible' as const) : ('hidden' as const),
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

  // Calculate z-index outside of style object to ensure it updates
  const zIndex = getPanelZIndex(name)

  // Bring panel to front only once when it first mounts
  useEffect(() => {
    if (isActive) {
      bringPanelToFront(name)
    }
  }, [isActive, bringPanelToFront, name])

  // Focus panel when it mounts to ensure escape key closes panel first
  // Only auto-focus if the panel was opened from keyboard (e.g., command palette)
  useLayoutEffect(() => {
    if (mounted && resizeContainerRef.current) {
      // Check if the previously focused element was the command palette or search input
      const previouslyFocused = document.activeElement
      const wasKeyboardTriggered =
        previouslyFocused?.closest('#nextjs-command-palette') !== null

      if (wasKeyboardTriggered) {
        // Small delay to ensure panel is fully rendered
        setTimeout(() => {
          resizeContainerRef.current?.focus()
        }, 50)
      }
    }
  }, [mounted])

  // Handle escape key with proper event capturing
  useEffect(() => {
    if (!mounted) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && resizeContainerRef.current) {
        // Check if this panel or its children have focus
        const hasFocus =
          document.activeElement === resizeContainerRef.current ||
          resizeContainerRef.current.contains(document.activeElement)

        if (hasFocus) {
          e.stopPropagation()
          e.preventDefault()
          closePanel(name as PanelStateKind)

          // Check if this was the last panel (besides command palette)
          const remainingPanels = Array.from(panels).filter(
            (p) => p !== name && p !== 'panel-selector'
          )

          // If command palette is open and this was the last other panel, focus it
          if (
            panels.has('panel-selector' as PanelStateKind) &&
            remainingPanels.length === 0
          ) {
            setTimeout(() => {
              const commandPalette = document.getElementById(
                'nextjs-command-palette'
              )
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

  // Don't render if not open at all
  if (!panels.has(name)) {
    return null
  }

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
        onMouseDown={() => {
          console.warn(`🖱️ PANEL CLICK for ${name}:`, {
            panelName: name,
            isActive,
            isDocked,
            zIndex: isDocked ? 999999999 : zIndex,
            action: isActive
              ? 'bringToFront'
              : isDocked
                ? 'swapPanels'
                : 'none',
          })

          if (isActive) {
            bringPanelToFront(name)
          } else if (isDocked) {
            swapPanels(name)
          }
        }}
        data-panel-name={name}
        data-panel-docked={isDocked}
        style={{
          position: 'fixed',
          zIndex: isDocked ? 2147483647 : zIndex, // Maximum possible z-index when docked
          outline: 'none',
          ...positionStyle,
          ...(isResizable && !isDocked
            ? {
                minWidth,
                minHeight,
                maxWidth,
                maxHeight,
              }
            : {}),
        }}
      >
        <DragProvider disabled={!draggable || isDocked}>
          <Draggable
            dragHandleSelector=".drag-handle"
            avoidZone={{
              corner: panels.has('panel-selector' as PanelStateKind)
                ? 'bottom-left'
                : state.devToolsPosition,
              square: panels.has('panel-selector' as PanelStateKind)
                ? 360
                : 25 / state.scale,
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
            disableDrag={!draggable || isDocked}
          >
            <>
              <div
                {...containerProps}
                className={isDocked ? 'docked-panel' : ''}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  border: isDocked
                    ? '1px solid rgba(255, 255, 255, 0.18)'
                    : '2px solid var(--color-gray-alpha-400)',
                  borderRadius: isDocked ? '10px' : 'var(--rounded-xl)',
                  background: isDocked
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'var(--color-background-100)',
                  boxShadow: isDocked
                    ? '0 2px 6px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isDocked ? 'pointer' : 'default',
                  pointerEvents: isDocked ? 'auto' : 'auto', // Keep pointer events on container
                  ...containerProps?.style,
                }}
              >
                <DragHandle>{header}</DragHandle>
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    pointerEvents: isDocked ? 'none' : 'auto', // Disable pointer events on content when docked
                  }}
                >
                  {children}
                </div>
              </div>
              {isResizable && !isDocked && (
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
