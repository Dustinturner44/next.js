import React, { useState, useEffect, useRef } from 'react'
import { CommandPalette } from './command-palette'
import { MenuItem } from '../components/errors/dev-tools-indicator/dev-tools-indicator'
import { css } from '../utils/css'

interface AccordionItem {
  label: string
  value: React.ReactNode
  onClick?: () => void
  attributes?: Record<string, string | boolean | undefined>
  deletable?: boolean
  isAccordion?: boolean
  accordionContent?: any[]
  accordionOpen?: boolean
}

export const AccordionCommandPalette = ({
  items,
  closeOnClickOutside = true,
  onDeleteItem,
}: {
  items: Array<AccordionItem | false | undefined | null>
  closeOnClickOutside?: boolean
  onDeleteItem?: (label: string) => void
}) => {
  // Start with accordions closed by default
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set())
  
  // Flatten items based on accordion state
  const flattenedItems = React.useMemo(() => {
    const result: any[] = []
    
    items.forEach((item) => {
      if (!item) return
      
      if (item.isAccordion) {
        // Add accordion header
        const isExpanded = expandedAccordions.has(item.label)
        result.push({
          ...item,
          value: (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)' 
            }}>
              {item.accordionContent?.length || 0}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          ),
          onClick: () => {
            setExpandedAccordions((prev) => {
              const next = new Set(prev)
              if (next.has(item.label)) {
                next.delete(item.label)
              } else {
                next.add(item.label)
              }
              return next
            })
          },
          attributes: {
            ...item.attributes,
            'data-accordion': 'true',
            'data-accordion-expanded': isExpanded ? 'true' : 'false',
          },
        })
        
        // Add accordion content if expanded
        if (isExpanded && item.accordionContent) {
          item.accordionContent.forEach((contentItem) => {
            result.push({
              ...contentItem,
              attributes: {
                ...contentItem.attributes,
                'data-accordion-child': 'true',
              },
              // Wrap the original label to add indentation
              label: contentItem.label,
              _originalLabel: contentItem.label, // Store original for deletion
              _isAccordionChild: true,
            })
          })
        }
      } else {
        result.push(item)
      }
    })
    
    return result
  }, [items, expandedAccordions])

  return (
    <>
      <CommandPalette
        items={flattenedItems}
        closeOnClickOutside={closeOnClickOutside}
        onDeleteItem={(label) => {
          // For accordion children, use the original label
          const item = flattenedItems.find(i => i.label === label)
          if (item && item._isAccordionChild && item._originalLabel) {
            onDeleteItem?.(item._originalLabel)
          } else {
            onDeleteItem?.(label)
          }
        }}
      />
      <style>{css`
        /* Style accordion items */
        .dev-tools-indicator-item[data-accordion="true"] {
          font-weight: 500;
          background-color: transparent;
        }
        
        .dev-tools-indicator-item[data-accordion="true"]:hover {
          background-color: var(--color-gray-alpha-100);
        }
        
        .dev-tools-indicator-item[data-accordion-expanded="true"] {
          background-color: var(--color-gray-alpha-50);
        }
        
        /* Style accordion children */
        .dev-tools-indicator-item[data-accordion-child="true"] {
          padding-left: 32px;
          position: relative;
        }
        
        .dev-tools-indicator-item[data-accordion-child="true"]::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: var(--color-gray-alpha-200);
        }
        
        .dev-tools-indicator-item[data-accordion-child="true"]:last-child::before {
          height: 50%;
        }
      `}</style>
    </>
  )
}