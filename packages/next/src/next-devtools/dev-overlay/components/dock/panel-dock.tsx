import React, { useMemo } from 'react'
import { type PanelStateKind } from '../../menu/context'
import { css } from '../../utils/css'

interface PanelDockProps {
  dockedPanels: Set<PanelStateKind>
  activePanel: PanelStateKind | null
  onPanelClick: (panelName: PanelStateKind) => void
}

export function PanelDock({ dockedPanels }: PanelDockProps) {
  // Filter out panel-selector
  const actualDockedPanels = Array.from(dockedPanels).filter(
    (p): p is Exclude<PanelStateKind, 'panel-selector'> =>
      p !== 'panel-selector'
  )

  // Calculate total width for centering - made more dense
  const dockItemWidth = 52 // Reduced from 64
  const dockGap = 8 // Reduced from 12
  const dockPadding = 10 // Reduced from 12
  const totalWidth =
    actualDockedPanels.length * dockItemWidth +
    (actualDockedPanels.length - 1) * dockGap +
    dockPadding * 2

  if (actualDockedPanels.length === 0) return null

  return (
    <>
      <div className="panel-dock" style={{ width: totalWidth }}>
        {/* Dock content will go here */}
      </div>
      <style>{css`
        .panel-dock {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 64px;
          padding: 0 ${dockPadding.toString()}px;
          gap: ${dockGap.toString()}px;
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(30px) saturate(150%);
          -webkit-backdrop-filter: blur(30px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(0, 0, 0, 0.6),
            inset 0 0 0 1px rgba(255, 255, 255, 0.04);
          z-index: 10000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .panel-dock {
            background: rgba(15, 15, 15, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow:
              0 4px 12px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(0, 0, 0, 0.7),
              inset 0 0 0 1px rgba(255, 255, 255, 0.03);
          }
        }
      `}</style>
    </>
  )
}

export function getDockItemPosition(
  panelName: PanelStateKind,
  dockedPanels: Set<PanelStateKind>
) {
  // panel-selector should never be docked
  if (panelName === 'panel-selector') {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // Filter out panel-selector from dock
  const dockedPanelArray = Array.from(dockedPanels).filter(
    (p): p is Exclude<PanelStateKind, 'panel-selector'> =>
      p !== 'panel-selector'
  )
  const dockIndex = dockedPanelArray.indexOf(
    panelName as Exclude<PanelStateKind, 'panel-selector'>
  )

  if (dockIndex === -1) {
    console.error(`❌ Panel ${panelName} not found in docked panels`, {
      panelName,
      dockedPanels: dockedPanelArray,
    })
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // Simple viewport-based positioning
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const itemSize = 52 // Reduced from 64 to match dock density
  const gap = 8 // Reduced from 12
  const dockHeight = 72 // Reduced from 88
  const dockBottomMargin = 16 // Reduced from 20
  const dockPadding = 10 // Reduced from 12

  // Calculate total width needed for all dock items
  const totalWidth =
    dockedPanelArray.length * itemSize + (dockedPanelArray.length - 1) * gap

  // Center dock horizontally in viewport
  const startX = (viewportWidth - totalWidth) / 2

  // Position this item
  const itemX = startX + dockIndex * (itemSize + gap)

  // Position on top of the dock background (dock bottom + dock padding)
  const dockTopY = viewportHeight - dockBottomMargin - dockHeight
  const itemY = dockTopY + dockPadding

  // Ensure positions are valid numbers
  const result = {
    x: isNaN(itemX) ? viewportWidth / 2 - itemSize / 2 : itemX,
    y: isNaN(itemY) ? viewportHeight - 100 : itemY,
    width: itemSize,
    height: itemSize,
  }

  console.warn(`🚢 DOCK POSITION for ${panelName}:`, {
    panelName,
    dockIndex,
    dockedPanelArray: dockedPanelArray.map((p) => p),
    viewport: { width: viewportWidth, height: viewportHeight },
    totalWidth,
    startX,
    itemPosition: { x: itemX, y: itemY },
    result,
  })

  return result
}
