import React, { useState } from 'react'
import { css } from '../utils/css'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  itemCount?: number
}

export const Accordion: React.FC<AccordionProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  itemCount 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="accordion-container">
      <button
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-title">
          {title}
          {itemCount !== undefined && itemCount > 0 && (
            <span className="accordion-count">({itemCount})</span>
          )}
        </span>
        <svg
          className="accordion-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
      <style>{css`
        .accordion-container {
          width: 100%;
        }

        .accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--color-text-primary);
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          transition: background-color 0.2s;
        }

        .accordion-header:hover {
          background-color: var(--color-gray-alpha-100);
        }

        .accordion-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .accordion-count {
          font-size: 12px;
          color: var(--color-text-secondary);
          font-weight: normal;
        }

        .accordion-chevron {
          width: 14px;
          height: 14px;
          color: var(--color-gray-600);
          flex-shrink: 0;
        }

        .accordion-content {
          padding-left: 12px;
          border-left: 1px solid var(--color-gray-alpha-200);
          margin-left: 20px;
        }
      `}</style>
    </div>
  )
}