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
    (p) => p !== 'panel-selector'
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
    <div className="panel-dock" style={{ width: totalWidth }}>
      <style>{css`
        .panel-dock {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          height: 72px; /* Reduced from 88px */
          z-index: 2147483646; /* Below docked panels */
          pointer-events: none;
          padding: ${dockPadding}px;

          /* macOS-style frosted glass effect */
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 20px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .panel-dock {
            background: rgba(30, 30, 30, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 0 0 1px rgba(255, 255, 255, 0.05),
              0 0 0 1px rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </div>
  )
}

export function getDockItemPosition(
  panelName: PanelStateKind,
  dockedPanels: Set<PanelStateKind>
) {
  // Filter out panel-selector from dock
  const dockedPanelArray = Array.from(dockedPanels).filter(
    (p) => p !== 'panel-selector'
  )
  const dockIndex = dockedPanelArray.indexOf(panelName)

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
