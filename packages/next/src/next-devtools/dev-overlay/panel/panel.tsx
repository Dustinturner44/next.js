import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useDevOverlayContext } from '../../dev-overlay.browser'
import { ResizeProvider } from '../components/devtools-panel/resize/resize-provider'
import { usePanelContext } from '../menu/context'
import { Overlay } from '../components/overlay'
import { INDICATOR_PADDING } from '../components/devtools-indicator/devtools-indicator'
import { getIndicatorOffset } from '../utils/indicator-metrics'
import { Draggable } from '../components/errors/dev-tools-indicator/draggable'
import {
  ACTION_DEVTOOLS_PANEL_POSITION,
  ACTION_DEVTOOLS_POSITION,
  STORAGE_KEY_PANEL_POSITION,
  type Corners,
} from '../shared'
import { ResizeHandle } from '../components/devtools-panel/resize/resize-handle'
import {
  DragHandle,
  DragProvider,
} from '../components/errors/dev-tools-indicator/drag-context'
import { useClickOutside } from '../components/errors/dev-tools-indicator/utils'

export function DevtoolPanelV2({
  header,
  children,
  draggable = true,
  sizeConfig = {
    kind: 'resizable',
    minWidth: 400,
    minHeight: 350,
    maxWidth: 1000,
    maxHeight: 1000,
  },
  name,
  closeOnClickOutside = false,
  onClose,
  ...containerProps
}: {
  name: string
  header: React.ReactNode
  children: React.ReactNode
  draggable?: boolean
  // todo: allow strings we do this so stupid
  sizeConfig?:
    | {
        kind: 'resizable'
        minWidth: number
        minHeight: number
        maxWidth: number
        maxHeight: number
      }
    | {
        kind: 'fixed'
        height: number
        width: number
      }
  closeOnClickOutside?: boolean
  onClose?: () => void
} & React.HTMLProps<HTMLDivElement>) {
  // might need this, we will see
  const [prevIsErrorOverlayOpen, setPrevIsErrorOverlayOpen] = useState(false)

  const { dispatch, state } = useDevOverlayContext()
  // i don't know if this is even needed with this state
  if (state.isErrorOverlayOpen !== prevIsErrorOverlayOpen) {
    if (state.isErrorOverlayOpen) {
      // We should always show the issues tab initially if we're
      // programmatically opening the panel to highlight errors.
    }
    setPrevIsErrorOverlayOpen(state.isErrorOverlayOpen)
  }
  const storagePositionKey = `${STORAGE_KEY_PANEL_POSITION}-${name}`

  const panelPosition: string = useMemo(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(storagePositionKey) ||
        state.devToolsPanelPosition ||
        state.devToolsPosition
      )
    }
    return state.devToolsPosition
  }, [storagePositionKey, state.devToolsPanelPosition, state.devToolsPosition])

  const [vertical, horizontal] = panelPosition.split('-', 2)
  const resizeRef = useRef<HTMLDivElement>(null)
  const { triggerRef } = usePanelContext()

  useClickOutside(resizeRef, triggerRef, closeOnClickOutside, () => {
    onClose?.()
  })

  const indicatorOffset = getIndicatorOffset(state)

  const [indicatorVertical, indicatorHorizontal] = state.devToolsPosition.split(
    '-',
    2
  )

  const verticalOffset =
    vertical === indicatorVertical && horizontal === indicatorHorizontal
      ? indicatorOffset
      : INDICATOR_PADDING

  const positionStyle = {
    [vertical]: `${verticalOffset}px`,
    [horizontal]: `${INDICATOR_PADDING}px`,
    [vertical === 'top' ? 'bottom' : 'top']: 'auto',
    [horizontal === 'left' ? 'right' : 'left']: 'auto',
  } as CSSProperties

  const isResizable = sizeConfig.kind === 'resizable'
  const minWidth = isResizable ? sizeConfig.minWidth : undefined
  const minHeight = isResizable ? sizeConfig.minHeight : undefined
  const maxWidth = isResizable ? sizeConfig.maxWidth : undefined
  const maxHeight = isResizable ? sizeConfig.maxHeight : undefined

  const fixedWidth = !isResizable ? sizeConfig.width : undefined
  const fixedHeight = !isResizable ? sizeConfig.height : undefined

  const resizeStorageKey = `${name}-panel-resize`

  const { storedWidth, storedHeight } = useMemo(() => {
    if (typeof window === 'undefined')
      return { storedWidth: undefined, storedHeight: undefined }
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(resizeStorageKey) || 'null'
      ) as { width?: number; height?: number } | null
      return {
        storedWidth: stored?.width,
        storedHeight: stored?.height,
      }
    } catch {
      return { storedWidth: undefined, storedHeight: undefined }
    }
  }, [resizeStorageKey])

  return (
    <ResizeProvider
      value={{
        resizeRef,

        minWidth,
        minHeight,
        devToolsPosition: state.devToolsPosition,
        storageKey: resizeStorageKey,
      }}
    >
      <div
        ref={resizeRef}
        data-nextjs-devtools-panel-overlay
        // data-nextjs-dialog-overlay

        data-gaga
        style={{
          position: 'fixed',
          // top: 0,
          // right: 0,
          // bottom: 0,
          // left: 0,
          zIndex: 2147483646,
          // display: 'flex',
          // alignContent: 'center',
          // alignItems: 'center',
          // padding: 'initial',
          // top: '10vh',
          // flexDirection: 'column',
          // padding: '10vh 15px 0',
          ...positionStyle,
          ...(isResizable
            ? {
                minWidth,
                minHeight,
                maxWidth,
                maxHeight,
                width: storedWidth ? `${storedWidth}px` : undefined,
                height: storedHeight ? `${storedHeight}px` : undefined,
              }
            : {
                height: storedHeight ? `${storedHeight}px` : fixedHeight,
                width: storedWidth
                  ? `${storedWidth}px`
                  : fixedWidth !== undefined
                    ? fixedWidth
                    : '100%',
              }),
        }}
      >
        <DragProvider disabled={!draggable}>
          <Draggable
            avoidZone={{
              corner: state.devToolsPosition,
              square: 36 / state.scale,
              padding: INDICATOR_PADDING,
            }}
            data-nextjs-devtools-panel-draggable
            padding={INDICATOR_PADDING}
            onDragStart={() => {}}
            position={panelPosition as Corners}
            setPosition={(p) => {
              localStorage.setItem(storagePositionKey, p)
              dispatch({
                type: ACTION_DEVTOOLS_PANEL_POSITION,
                devToolsPanelPosition: p,
              })
            }}
            // dragHandleSelector="[data-nextjs-devtools-panel-header], [data-nextjs-devtools-panel-footer], [data-nextjs-devtools-panel-draggable]"
            style={{
              overflow: 'auto',
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
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--rounded-xl)',
                  background: 'var(--color-background-200)',
                  overflow: 'auto',
                  ...containerProps.style,
                }}
              >
                <DragHandle>{header}</DragHandle>
                {children}
              </div>
              {isResizable && (
                <>
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="top"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="right"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="bottom"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="left"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="top-left"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="top-right"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="bottom-left"
                  />
                  <ResizeHandle
                    position={state.devToolsPanelPosition}
                    direction="bottom-right"
                  />
                </>
              )}
            </>
          </Draggable>
        </DragProvider>
      </div>
    </ResizeProvider>
  )
}
