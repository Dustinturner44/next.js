'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../shared.css'
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
      // Demonstrating both createElement and JSX syntax
      return React.createElement('div', null, 'Hello World')
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
    // @ts-ignore
    return <Image src='/test.jpg' alt='test' width={100} height={100} />;
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

              <div className="content main-page">
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
    </div>
  )
} 