import { useDevOverlayContext } from '../../dev-overlay.browser'
import { useClickOutsideAndEscape, getShadowRoot } from '../components/errors/dev-tools-indicator/utils'
import { useLayoutEffect, useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  MenuContext,
  MenuItem,
} from '../components/errors/dev-tools-indicator/dev-tools-indicator'
import { usePanelRouterContext, type PanelStateKind } from './context'
import { usePanelContext } from './panel-router'

// Context menu component
const ContextMenu = ({ 
  x, 
  y, 
  onClose, 
  onDelete,
  onRename,
  isRenameable = false
}: { 
  x: number
  y: number
  onClose: () => void
  onDelete: () => void
  onRename?: () => void
  isRenameable?: boolean
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return
      }
      onClose()
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    // Add listeners to both shadow DOM and document to ensure we catch all clicks
    // Use a slight delay to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      const shadowRoot = getShadowRoot()
      if (shadowRoot) {
        shadowRoot.addEventListener('mousedown', handleClickOutside)
        shadowRoot.addEventListener('keydown', handleEscape)
      }
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 10)
    
    return () => {
      clearTimeout(timer)
      const shadowRoot = getShadowRoot()
      if (shadowRoot) {
        shadowRoot.removeEventListener('mousedown', handleClickOutside)
        shadowRoot.removeEventListener('keydown', handleEscape)
      }
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])
  
  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: 'rgb(20, 20, 20)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        zIndex: 2147483647, // Maximum z-index
        minWidth: '120px',
        opacity: 1,
      }}
    >
      {isRenameable && onRename && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRename()
            // Close menu after a short delay to ensure rename happens
            setTimeout(() => onClose(), 100)
          }}
          onMouseDown={(e) => {
            // Prevent mousedown from bubbling and closing the menu
            e.stopPropagation()
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            fontFamily: 'var(--font-stack-sans)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          Rename
        </button>
      )}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete()
          // Close menu after a short delay to ensure delete happens
          setTimeout(() => onClose(), 100)
        }}
        onMouseDown={(e) => {
          // Prevent mousedown from bubbling and closing the menu
          e.stopPropagation()
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: 'rgba(239, 68, 68, 1)',
          fontSize: '14px',
          fontFamily: 'var(--font-stack-sans)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        Delete
      </button>
    </div>
  )
}

// Custom MenuItem wrapper that handles context menu
const MenuItemWithContextMenu = ({ 
  item, 
  index,
  adjustedIndex,
  onContextMenu,
  isContextMenuTarget,
}: {
  item: {
    onClick?: () => void
    title?: string
    label: string
    value: React.ReactNode
    attributes?: Record<string, string | boolean | undefined>
    deletable?: boolean
    renameable?: boolean
    onRename?: () => void
    isRenaming?: boolean
    renameValue?: string
    onRenameSubmit?: (value: string) => void
    onRenameCancel?: () => void
  }
  index: number
  adjustedIndex: number | undefined
  onContextMenu: (e: React.MouseEvent, label: string) => void
  isContextMenuTarget: boolean
}) => {
  const [editValue, setEditValue] = useState(item.renameValue || item.label)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update edit value when renameValue changes, but only if we're in rename mode
  useEffect(() => {
    if (item.isRenaming) {
      setEditValue(item.renameValue || item.label)
    }
  }, [item.renameValue, item.label, item.isRenaming])

  useEffect(() => {
    if (item.isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [item.isRenaming])

  const handleSubmit = () => {
    if (item.onRenameSubmit) {
      item.onRenameSubmit(editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (item.onRenameCancel) {
        item.onRenameCancel()
      }
      setEditValue(item.renameValue || item.label)
    }
  }

  if (item.isRenaming) {
    return (
      <div
        style={{
          padding: '0 12px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (item.onRenameCancel) {
              item.onRenameCancel()
            }
          }}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '13px',
            fontFamily: 'var(--font-stack-sans)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'rgba(255, 255, 255, 0.9)',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSubmit()
          }}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-stack-sans)',
            backgroundColor: 'var(--color-green-700)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (item.onRenameCancel) {
              item.onRenameCancel()
            }
            setEditValue(item.renameValue || item.label)
          }}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-stack-sans)',
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }
  return (
    <div
      onContextMenu={(e) => {
        if (item.deletable !== false) {
          e.preventDefault()
          onContextMenu(e, item.label)
        }
      }}
      style={{ 
        position: 'relative',
        ...(isContextMenuTarget && {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          outline: '2px solid rgba(255, 255, 255, 0.2)',
          outlineOffset: '-1px',
        })
      }}
    >
      <MenuItem
        key={item.label}
        title={item.title}
        label={item.label}
        value={item.value}
        onClick={item.onClick}
        index={adjustedIndex}
        {...item.attributes}
      />
    </div>
  )
}

export const CommandPalette = ({
  closeOnClickOutside = true,
  items,
  onDeleteItem,
}: {
  closeOnClickOutside?: boolean
  items: Array<
    | false
    | undefined
    | null
    | {
        onClick?: () => void
        title?: string
        label: string
        value: React.ReactNode
        attributes?: Record<string, string | boolean | undefined>
        deletable?: boolean
        renameable?: boolean
        onRename?: () => void
        isRenaming?: boolean
        renameValue?: string
        onRenameSubmit?: (value: string) => void
        onRenameCancel?: () => void
      }
  >
  onDeleteItem?: (label: string) => void
}) => {
  const { closePanel, triggerRef, setSelectedIndex, selectedIndex, panels, bringPanelToFront, getPanelZIndex } =
    usePanelRouterContext()
  const { mounted } = usePanelContext()
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    itemLabel: string
  } | null>(null)

  const paletteRef = useRef<HTMLDivElement>(null)

  useClickOutsideAndEscape(
    paletteRef,
    triggerRef,
    mounted,
    (reason) => {
      switch (reason) {
        case 'escape': {
          // Only handle escape if the command palette has focus
          const hasFocus = document.activeElement === paletteRef.current || 
                          paletteRef.current?.contains(document.activeElement)
          
          if (hasFocus) {
            closePanel('panel-selector' as PanelStateKind)
            setSelectedIndex(-1)
            setSearchQuery('')
          }
          return
        }
        case 'outside': {
          if (!closeOnClickOutside) {
            return
          }
          closePanel('panel-selector' as PanelStateKind)
          setSelectedIndex(-1)
          return
        }
        default: {
          return null!
        }
      }
    }
  )

  useLayoutEffect(() => {
    paletteRef.current?.focus()
    selectMenuItem({
      index: selectedIndex === -1 ? 'first' : selectedIndex,
      paletteRef,
      setSelectedIndex,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Bring palette to front in a separate effect
  useEffect(() => {
    bringPanelToFront('panel-selector')
  }, []) // Only run once on mount

  // Filter out falsy items
  const filteredItems = useMemo(() => {
    return items.filter((item) => !!item)
  }, [items])

  function onPaletteKeydown(e: React.KeyboardEvent<HTMLDivElement | null>) {
    const clickableItems = filteredItems.filter((item) => item.onClick)
    const totalClickableItems = clickableItems.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const next =
          selectedIndex >= totalClickableItems - 1 ? 0 : selectedIndex + 1
        selectMenuItem({ index: next, paletteRef, setSelectedIndex })
        break
      case 'ArrowUp':
        e.preventDefault()
        const prev =
          selectedIndex <= 0 ? totalClickableItems - 1 : selectedIndex - 1
        selectMenuItem({ index: prev, paletteRef, setSelectedIndex })
        break
      case 'Home':
        e.preventDefault()
        selectMenuItem({ index: 'first', paletteRef, setSelectedIndex })
        break
      case 'End':
        e.preventDefault()
        selectMenuItem({ index: 'last', paletteRef, setSelectedIndex })
        break
      case 'Enter':
        e.preventDefault()
        const selectedItem = clickableItems[selectedIndex]
        if (selectedItem?.onClick) {
          selectedItem.onClick()
        }
        break
      case 'k':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          closePanel('panel-selector' as PanelStateKind)
          setSelectedIndex(-1)
        }
        break
      case 'Escape':
        // This is handled by useClickOutsideAndEscape
        break
      case 'n':
        if (e.ctrlKey) {
          e.preventDefault()
          const nextCtrl =
            selectedIndex >= totalClickableItems - 1 ? 0 : selectedIndex + 1
          selectMenuItem({ index: nextCtrl, paletteRef, setSelectedIndex })
        }
        break
      case 'p':
        if (e.ctrlKey) {
          e.preventDefault()
          const prevCtrl =
            selectedIndex <= 0 ? totalClickableItems - 1 : selectedIndex - 1
          selectMenuItem({ index: prevCtrl, paletteRef, setSelectedIndex })
        }
        break
      default:
        break
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, label: string) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemLabel: label,
    })
  }, [])

  const handleDeleteItem = useCallback(() => {
    if (contextMenu && onDeleteItem) {
      onDeleteItem(contextMenu.itemLabel)
    }
  }, [contextMenu, onDeleteItem])

  const handleRenameItem = useCallback(() => {
    if (contextMenu) {
      // Find the item that was right-clicked
      const item = items.find(item => item.label === contextMenu.itemLabel)
      if (item && item.onRename) {
        item.onRename()
      }
    }
  }, [contextMenu, items])

  return (
    <>
      <div
        ref={paletteRef}
        onKeyDown={onPaletteKeydown}
        onMouseDown={() => bringPanelToFront('panel-selector')}
        id="nextjs-command-palette"
        role="dialog"
        aria-label="Command Palette"
        tabIndex={-1}
        style={{
        outline: 0,
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(0, 0, 0)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        backgroundClip: 'padding-box',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderRadius: '12px',
        position: 'fixed',
        fontFamily: 'var(--font-stack-sans)',
        zIndex: Math.max(getPanelZIndex('panel-selector'), 9999), // Ensure it's always on top
        overflow: 'hidden',
        opacity: 1,
        width: '360px',
        maxHeight: '520px',
        bottom: '60px', // Adjusted to account for the devtools indicator
        left: '20px',
        transition:
          'opacity var(--animate-out-duration-ms) var(--animate-out-timing-function)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >

      <MenuContext
        value={{
          selectedIndex,
          setSelectedIndex,
          closeMenu: () => {}, // Don't close palette when clicking items
        }}
      >
        {/* Scrollable main items area */}
        <div 
          style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          {filteredItems.length > 0 && (
            <div style={{ padding: '6px', width: '100%' }}>
              {filteredItems.map((item, index) => (
                <MenuItemWithContextMenu
                  key={item.label}
                  item={item}
                  index={index}
                  adjustedIndex={
                    item.onClick
                      ? getAdjustedIndex(filteredItems, index)
                      : undefined
                  }
                  onContextMenu={handleContextMenu}
                  isContextMenuTarget={contextMenu?.itemLabel === item.label}
                />
              ))}
            </div>
          )}
          
        </div>
      </MenuContext>
    </div>
    
    {contextMenu && getShadowRoot() && createPortal(
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(null)}
        onDelete={handleDeleteItem}
        onRename={handleRenameItem}
        isRenameable={(() => {
          const item = items.find(item => item.label === contextMenu.itemLabel)
          return item?.renameable || false
        })()}
      />,
      getShadowRoot() as any
    )}
    </>
  )
}

export function getAdjustedIndex(
  items: Array<{ onClick?: () => void }>,
  targetIndex: number
): number {
  let adjustedIndex = 0

  for (let i = 0; i <= targetIndex && i < items.length; i++) {
    if (items[i].onClick) {
      if (i === targetIndex) {
        return adjustedIndex
      }
      adjustedIndex++
    }
  }

  return adjustedIndex
}

export function getClickableItemsCount(
  items: Array<{ onClick?: () => void }>
): number {
  return items.filter((item) => item.onClick).length
}

export function selectMenuItem({
  index,
  paletteRef,
  setSelectedIndex,
}: {
  index: number | 'first' | 'last'
  paletteRef: React.RefObject<HTMLDivElement | null>
  setSelectedIndex: (index: number) => void
}) {
  if (index === 'first') {
    setTimeout(() => {
      const all = paletteRef.current?.querySelectorAll('[role="menuitem"]')
      if (all && all.length > 0) {
        const firstIndex = all[0].getAttribute('data-index')
        selectMenuItem({ index: Number(firstIndex), paletteRef, setSelectedIndex })
      }
    })
    return
  }

  if (index === 'last') {
    setTimeout(() => {
      const all = paletteRef.current?.querySelectorAll('[role="menuitem"]')
      if (all && all.length > 0) {
        const lastIndex = all.length - 1
        selectMenuItem({ index: lastIndex, paletteRef, setSelectedIndex })
      }
    })
    return
  }

  const el = paletteRef.current?.querySelector(
    `[data-index="${index}"]`
  ) as HTMLElement

  if (el) {
    setSelectedIndex(index)
    el?.scrollIntoView({ block: 'nearest' })
  }
}