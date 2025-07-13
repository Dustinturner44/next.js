import { useDevOverlayContext } from '../../dev-overlay.browser'
import { useClickOutsideAndEscape } from '../components/errors/dev-tools-indicator/utils'
import { useLayoutEffect, useRef, useState, useMemo } from 'react'
import {
  MenuContext,
  MenuItem,
} from '../components/errors/dev-tools-indicator/dev-tools-indicator'
import { usePanelRouterContext, type PanelStateKind } from './context'
import { usePanelContext } from './panel-router'

export const CommandPalette = ({
  closeOnClickOutside = true,
  items,
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
        footer?: boolean
      }
  >
}) => {
  const { closePanel, triggerRef, setSelectedIndex, selectedIndex, panels, bringPanelToFront, getPanelZIndex } =
    usePanelRouterContext()
  const { mounted } = usePanelContext()
  const [searchQuery, setSearchQuery] = useState('')

  const paletteRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
          setSearchQuery('')
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
    searchInputRef.current?.focus()
    bringPanelToFront('panel-selector')
    selectMenuItem({
      index: selectedIndex === -1 ? 'first' : selectedIndex,
      paletteRef,
      setSelectedIndex,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const definedItems = items.filter((item) => !!item)
    const footerItems = definedItems.filter((item) => item.footer)
    const nonFooterItems = definedItems.filter((item) => !item.footer)
    
    if (!searchQuery.trim()) {
      return { itemsAboveFooter: nonFooterItems, itemsBelowFooter: footerItems }
    }
    
    // Only filter non-footer items, always show footer items
    const filteredNonFooter = nonFooterItems.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    return { itemsAboveFooter: filteredNonFooter, itemsBelowFooter: footerItems }
  }, [items, searchQuery])

  const { itemsAboveFooter, itemsBelowFooter } = filteredItems

  function onPaletteKeydown(e: React.KeyboardEvent<HTMLDivElement | null>) {
    const allFilteredItems = [...itemsAboveFooter, ...itemsBelowFooter]
    const clickableItems = allFilteredItems.filter((item) => item.onClick)
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
          setSearchQuery('')
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
        // Let other keys through to the search input
        if (searchInputRef.current && e.target !== searchInputRef.current) {
          searchInputRef.current.focus()
        }
        break
    }
  }

  return (
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
        background: 'var(--color-background-100)',
        backgroundClip: 'padding-box',
        boxShadow: 'var(--shadow-menu)',
        borderRadius: 'var(--rounded-xl)',
        position: 'fixed',
        fontFamily: 'var(--font-stack-sans)',
        zIndex: Math.max(getPanelZIndex('panel-selector'), 9999), // Ensure it's always on top
        overflow: 'hidden',
        opacity: 1,
        width: '320px',
        maxHeight: '480px',
        bottom: '60px', // Adjusted to account for the devtools indicator
        left: '20px',
        transition:
          'opacity var(--animate-out-duration-ms) var(--animate-out-timing-function)',
        border: '1px solid var(--color-gray-alpha-400)',
      }}
    >
      {/* Search Input */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--color-gray-alpha-200)' }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            // Reset selection when search changes
            setSelectedIndex(-1)
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--color-gray-alpha-400)',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'var(--font-stack-sans)',
            background: 'var(--color-background-100)',
            color: 'var(--color-gray-900)',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              paletteRef.current?.focus()
              onPaletteKeydown(e as any)
            } else if (e.key === 'n' && e.ctrlKey) {
              e.preventDefault()
              paletteRef.current?.focus()
              onPaletteKeydown(e as any)
            } else if (e.key === 'p' && e.ctrlKey) {
              e.preventDefault()
              paletteRef.current?.focus()
              onPaletteKeydown(e as any)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              paletteRef.current?.focus()
              onPaletteKeydown(e as any)
            }
          }}
        />
      </div>

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
          {itemsAboveFooter.length > 0 && (
            <div style={{ padding: '6px', width: '100%' }}>
              {itemsAboveFooter.map((item, index) => (
                <MenuItem
                  key={item.label}
                  title={item.title}
                  label={item.label}
                  value={item.value}
                  onClick={item.onClick}
                  index={
                    item.onClick
                      ? getAdjustedIndex(itemsAboveFooter, index)
                      : undefined
                  }
                  {...item.attributes}
                />
              ))}
            </div>
          )}
          
          {itemsAboveFooter.length === 0 && searchQuery.trim() && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: 'var(--color-gray-600)',
              fontSize: '14px'
            }}>
              No commands found for "{searchQuery}"
            </div>
          )}
        </div>
        
        {/* Fixed footer section */}
        {itemsBelowFooter.length > 0 && (
          <div className="dev-tools-indicator-footer" style={{ flexShrink: 0 }}>
            {itemsBelowFooter.map((item, index) => (
              <MenuItem
                key={item.label}
                title={item.title}
                label={item.label}
                value={item.value}
                onClick={item.onClick}
                {...item.attributes}
                index={
                  item.onClick
                    ? getAdjustedIndex(itemsBelowFooter, index) +
                      getClickableItemsCount(itemsAboveFooter)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </MenuContext>
    </div>
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