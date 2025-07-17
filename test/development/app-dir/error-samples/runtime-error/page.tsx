'use client'

import { useState } from 'react'
import Link from 'next/link'

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

      <div className="content">
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

        .error-display {
          margin: 1rem 0;
          padding: 1rem;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }

        .error-display h4 {
          margin: 0 0 0.5rem 0;
          color: #dc2626;
          font-size: 1rem;
        }

        .error-display code {
          color: #7f1d1d;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
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

        .error-btn.type {
          background: #dc2626;
        }

        .error-btn.type:hover {
          background: #b91c1c;
        }

        .error-btn.reference {
          background: #ea580c;
        }

        .error-btn.reference:hover {
          background: #c2410c;
        }

        .error-btn.range {
          background: #d97706;
        }

        .error-btn.range:hover {
          background: #b45309;
        }

        .error-btn.syntax {
          background: #7c2d12;
        }

        .error-btn.syntax:hover {
          background: #5b1a0b;
        }

        .error-btn.custom {
          background: #7c3aed;
        }

        .error-btn.custom:hover {
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