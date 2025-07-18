'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../shared.css'

export default function RuntimeErrorPage() {
  const [errorType, setErrorType] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string>('')

  const triggerTypeError = () => {
    setErrorType('TypeError')
    setLastError('')
    try {
      // @ts-ignore - intentionally cause TypeError
      const result = null.someProperty.anotherProperty
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  const triggerReferenceError = () => {
    setErrorType('ReferenceError')
    setLastError('')
    try {
      // @ts-ignore - intentionally cause ReferenceError
      console.log(undefinedVariable)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  const triggerRangeError = () => {
    setErrorType('RangeError')
    setLastError('')
    try {
      // Create array with negative length
      const arr = new Array(-1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  const triggerSyntaxError = () => {
    setErrorType('SyntaxError')
    setLastError('')
    try {
      // Intentional syntax error via eval
      eval('var a = {')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  const triggerCustomError = () => {
    setErrorType('Custom Error')
    setLastError('')
    try {
      throw new Error('This is a custom error for testing the auto-fix feature')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  const clearError = () => {
    setErrorType(null)
    setLastError('')
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Runtime Error Examples</h1>
        <p>This page demonstrates common JavaScript runtime errors that occur during execution</p>
      </header>

      <div className="content main-page">
        <div className="explanation">
          <h2>Common Runtime Errors</h2>
          <ul>
            <li><strong>TypeError:</strong> Attempting to use a value in an inappropriate way</li>
            <li><strong>ReferenceError:</strong> Trying to access an undefined variable</li>
            <li><strong>RangeError:</strong> Number is outside the allowable range</li>
            <li><strong>SyntaxError:</strong> Code cannot be parsed (rare in runtime)</li>
            <li><strong>Custom Errors:</strong> Application-specific error conditions</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {errorType ? `${errorType} triggered` : 'No error active'}</p>
            
            {lastError && (
              <div className="error-display">
                <h4>Last Error:</h4>
                <code>{lastError}</code>
              </div>
            )}

            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerTypeError} className="error-btn type">
                  TypeError
                </button>
                <button onClick={triggerReferenceError} className="error-btn reference">
                  ReferenceError
                </button>
                <button onClick={triggerRangeError} className="error-btn range">
                  RangeError
                </button>
                <button onClick={triggerSyntaxError} className="error-btn syntax">
                  SyntaxError
                </button>
                <button onClick={triggerCustomError} className="error-btn custom">
                  Custom Error
                </button>
                <button onClick={clearError} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>

            {errorType && (
              <div className="warning">
                <strong>⚠️ {errorType} Active</strong>
                <p>Check the dev tools console and error overlay for details. Click the auto-fix button to test the AI fixing feature.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Example Problem Code:</h3>
          <pre>{`// ❌ TypeError - accessing property of null
const user = null
const name = user.name // TypeError: Cannot read properties of null

// ❌ ReferenceError - undefined variable
console.log(undefinedVariable) // ReferenceError: undefinedVariable is not defined

// ❌ RangeError - invalid array length
const arr = new Array(-1) // RangeError: Invalid array length

// ❌ Custom errors
if (!userInput) {
  throw new Error('User input is required')
}

// ✅ Proper error handling
const user = null
const name = user?.name ?? 'Unknown' // Safe access

// ✅ Check before use
if (typeof myVariable !== 'undefined') {
  console.log(myVariable)
}

// ✅ Validate inputs
const createArray = (length) => {
  if (length < 0) {
    throw new Error('Array length must be non-negative')
  }
  return new Array(length)
}`}</pre>
        </div>
      </div>
    </div>
  )
} 