'use client'

import { useState } from 'react'
import Link from 'next/link'
// Intentionally missing imports to demonstrate errors

export default function MissingImportPage() {
  const [triggerError, setTriggerError] = useState(false)
  const [errorType, setErrorType] = useState<string | null>(null)

  const triggerMissingReactImport = () => {
    setErrorType('Missing React Import')
    setTriggerError(true)
    try {
      // This would fail without React import in older versions
      // @ts-ignore
      return React.createElement('div', null, 'Hello')
    } catch (error) {
      throw error
    }
  }

  const triggerMissingHookImport = () => {
    setErrorType('Missing Hook Import')
    setTriggerError(true)
    try {
      // This will fail without proper useEffect import
      // @ts-ignore
      useEffect(() => {
        console.log('Effect running')
      }, [])
    } catch (error) {
      throw error
    }
  }

  const triggerMissingComponentImport = () => {
    setErrorType('Missing Component Import')
    setTriggerError(true)
    try {
      // This will fail - Image component not imported
      // @ts-ignore
      return Image({ src: '/test.jpg', alt: 'test', width: 100, height: 100 })
    } catch (error) {
      throw error
    }
  }

  const triggerMissingUtilImport = () => {
    setErrorType('Missing Utility Import')
    setTriggerError(true)
    try {
      // This will fail - clsx utility not imported
      // @ts-ignore
      const classes = clsx('btn', 'btn-primary')
      return classes
    } catch (error) {
      throw error
    }
  }

  const clearError = () => {
    setTriggerError(false)
    setErrorType(null)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Missing Import Errors</h1>
        <p>This page demonstrates errors caused by missing or incorrect imports</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>Common Import Errors</h2>
          <ul>
            <li><strong>Missing React imports:</strong> Forgetting to import React or hooks</li>
            <li><strong>Missing component imports:</strong> Using components without importing them</li>
            <li><strong>Missing utility imports:</strong> Using libraries without proper imports</li>
            <li><strong>Incorrect import paths:</strong> Wrong relative or absolute paths</li>
            <li><strong>Named vs default imports:</strong> Mixing up import syntax</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {triggerError ? `${errorType} triggered` : 'No error active'}</p>
            
            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerMissingReactImport} className="error-btn react">
                  Missing React
                </button>
                <button onClick={triggerMissingHookImport} className="error-btn hook">
                  Missing Hook
                </button>
                <button onClick={triggerMissingComponentImport} className="error-btn component">
                  Missing Component
                </button>
                <button onClick={triggerMissingUtilImport} className="error-btn util">
                  Missing Utility
                </button>
                <button onClick={clearError} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>

            {triggerError && (
              <div className="warning">
                <strong>⚠️ {errorType} Active</strong>
                <p>Check the console for import errors. The auto-fix feature should suggest the correct imports.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Common Import Problems & Solutions:</h3>
          <pre>{`// ❌ Missing React import (older versions)
function Component() {
  return <div>Hello</div> // Error: React is not defined
}

// ✅ Correct React import
import React from 'react'
function Component() {
  return <div>Hello</div>
}

// ❌ Missing hook import
function Component() {
  useEffect(() => {}, []) // Error: useEffect is not defined
  return <div>Hello</div>
}

// ✅ Correct hook import
import { useEffect } from 'react'
function Component() {
  useEffect(() => {}, [])
  return <div>Hello</div>
}

// ❌ Missing Next.js component import
function Page() {
  return <Image src="/pic.jpg" alt="pic" /> // Error: Image is not defined
}

// ✅ Correct Next.js import
import Image from 'next/image'
function Page() {
  return <Image src="/pic.jpg" alt="pic" width={100} height={100} />
}

// ❌ Wrong import syntax
import clsx from 'clsx' // Might be wrong if clsx exports named exports
const classes = clsx('a', 'b')

// ✅ Correct import syntax (depends on library)
import { clsx } from 'clsx' // or
import clsx from 'clsx'

// ❌ Wrong path
import { utils } from './utilities' // File might be in different location

// ✅ Correct path
import { utils } from '../lib/utilities'
import { utils } from '@/utils/utilities' // With path mapping`}</pre>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .header {
          margin-bottom: 2rem;
        }

        .back-link {
          color: #0070f3;
          text-decoration: none;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0.5rem 0;
          color: #1a1a1a;
        }

        .header p {
          color: #666;
          margin: 0;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .explanation {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid #0070f3;
        }

        .explanation h2 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .explanation ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .explanation li {
          margin-bottom: 0.5rem;
        }

        .demo {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .demo h3 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .controls {
          margin: 1.5rem 0;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .error-btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .error-btn.react {
          background: #1e40af;
        }

        .error-btn.react:hover {
          background: #1d4ed8;
        }

        .error-btn.hook {
          background: #059669;
        }

        .error-btn.hook:hover {
          background: #047857;
        }

        .error-btn.component {
          background: #7c2d12;
        }

        .error-btn.component:hover {
          background: #5b1a0b;
        }

        .error-btn.util {
          background: #7c3aed;
        }

        .error-btn.util:hover {
          background: #6d28d9;
        }

        .clear-btn {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .warning strong {
          color: #92400e;
        }

        .warning p {
          margin: 0.5rem 0 0 0;
          color: #92400e;
        }

        .code-example {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 1.5rem;
          color: white;
        }

        .code-example h3 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .code-example pre {
          margin: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 1.5rem;
          }

          .button-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
} 