import React, { useRef, useEffect, useState } from 'react'
import { usePanelContext } from '../menu/panel-router'
import { usePanelRouterContext } from '../menu/context'
import { useDevOverlayContext } from '../../dev-overlay.browser'
import { useClickOutsideAndEscape } from '../components/errors/dev-tools-indicator/utils'
import {
  DragProvider,
  DragHandle,
} from '../components/errors/dev-tools-indicator/drag-context'
import { Draggable } from '../components/errors/dev-tools-indicator/draggable'
import { INDICATOR_PADDING } from '../components/devtools-indicator/devtools-indicator'
import { type PanelStateKind } from '../menu/context'

export interface DynamicPanelProps {
  children: React.ReactNode
  header?: React.ReactNode
  sizeConfig:
    | { kind: 'fixed'; width: number; height: number }
    | {
        kind: 'resizable'
        minWidth: number
        minHeight: number
        maxWidth: string
        maxHeight: string
        initialSize: { width: number; height: number }
      }
  closeOnClickOutside?: boolean
  sharePanelSizeGlobally?: boolean
  sharePanelPositionGlobally?: boolean
  draggable?: boolean
}

export function DynamicPanel({
  children,
  header,
  sizeConfig,
  closeOnClickOutside = false,
  sharePanelSizeGlobally = true,
  sharePanelPositionGlobally = true,
  draggable = true,
}: DynamicPanelProps) {
  const { name, mounted } = usePanelContext()
  const {
    closePanel,
    triggerRef,
    bringPanelToFront,
    getPanelZIndex,
    activePanel,
    panels,
    setPanelPosition,
    getPanelPosition,
  } = usePanelRouterContext()
  const { state } = useDevOverlayContext()

  const resizeContainerRef = useRef<HTMLDivElement>(null)
  const [panelSize, setPanelSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [position, setPosition] = useState(() => getPanelPosition(name))

  const isActive = activePanel === name
  const isResizable = sizeConfig.kind === 'resizable'
  const zIndex = getPanelZIndex(name)

  // Update position when panel becomes active (for swapping)
  useEffect(() => {
    if (isActive) {
      const newPosition = getPanelPosition(name)
      setPosition(newPosition)
    }
  }, [isActive, name, getPanelPosition])

  // Panel should be visible if it's active or if hub/panel-selector is active
  const isNonModalPanelActive =
    activePanel === 'hub' || activePanel === 'panel-selector'
  const shouldBeVisible =
    isActive || (panels.has(name) && isNonModalPanelActive)

  // Size calculations
  const actualWidth =
    sizeConfig.kind === 'fixed'
      ? sizeConfig.width
      : panelSize?.width || sizeConfig.initialSize?.width || 400
  const actualHeight =
    sizeConfig.kind === 'fixed'
      ? sizeConfig.height
      : panelSize?.height || sizeConfig.initialSize?.height || 300

  // Position calculation
  const getActualPosition = () => {
    return {
      left: position.x,
      top: position.y,
      transform: 'scale(1)',
    }
  }

  // Position styles with smooth transitions
  const positionStyle = {
    ...getActualPosition(),
    transformOrigin: 'center center',
    opacity: shouldBeVisible ? 1 : 0,
    transition:
      'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  // Click outside handler
  useClickOutsideAndEscape(
    resizeContainerRef,
    triggerRef,
    mounted,
    closeOnClickOutside ? (reason) => closePanel(name) : () => {}
  )

  if (!shouldBeVisible) {
    return null
  }

  return (
    <div
      ref={resizeContainerRef}
      data-panel-name={name}
      data-panel-active={isActive}
      data-panel-docked={false}
      style={{
        position: 'fixed',
        zIndex: zIndex,
        ...positionStyle,
        pointerEvents: 'auto',
      }}
      onMouseDown={() => {
        if (isActive) {
          bringPanelToFront(name)
        }
      }}
    >
      <DragProvider disabled={!draggable}>
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
          onDrag={(x, y) => {
            const newPosition = { x, y }
            setPosition(newPosition)
            setPanelPosition(name, newPosition)
          }}
        >
          <div
            style={{
              width: actualWidth,
              height: actualHeight,
              pointerEvents: 'auto',
            }}
          >
            <div
              className={''}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--color-gray-alpha-400)',
                borderRadius: 'var(--rounded-xl)',
                background: 'var(--color-background-100)',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'default',
                pointerEvents: 'auto',
              }}
            >
              <DragHandle>{header}</DragHandle>
              <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
            </div>
          </div>
        </Draggable>
      </DragProvider>
    </div>
  )
}
