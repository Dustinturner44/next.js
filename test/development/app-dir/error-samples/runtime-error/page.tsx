'use client'

import Link from 'next/link'

export default function RuntimeErrorPage() {
  // These will immediately cause runtime errors
  // @ts-ignore - intentional runtime error
  const nullAccess = null.someProperty.anotherProperty
  // @ts-ignore - intentional runtime error
  const undefinedCall = undefinedFunction()
  const invalidArray = new Array(-1)
  // @ts-ignore - intentional runtime error
  const badMath = Math.sqrt(-1).toFixed('invalid')
  
  return (
    <div className="container">
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Runtime Error Examples</h1>
        <p>This page immediately throws JavaScript runtime errors</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>🔴 Active Runtime Errors</h2>
          <ul>
            <li>TypeError: Cannot read properties of null</li>
            <li>ReferenceError: undefinedFunction is not defined</li>
            <li>RangeError: Invalid array length</li>
            <li>TypeError: Invalid arguments to toFixed</li>
          </ul>
        </div>

        <div className="error-showcase">
          <h3>Runtime Error Examples</h3>
          
          <div className="error-item">
            <h4>Null Property Access:</h4>
            <div className="error-content">
              Result: {nullAccess}
            </div>
          </div>

          <div className="error-item">
            <h4>Undefined Function Call:</h4>
            <div className="error-content">
              Result: {undefinedCall}
            </div>
          </div>

          <div className="error-item">
            <h4>Invalid Array Length:</h4>
            <div className="error-content">
              Array: {invalidArray}
            </div>
          </div>

          <div className="error-item">
            <h4>Invalid Method Arguments:</h4>
            <div className="error-content">
              Fixed: {badMath}
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Currently Active):</h3>
          <pre>{`// ❌ These lines cause immediate runtime errors:

// TypeError: Cannot read properties of null
const nullAccess = null.someProperty.anotherProperty

// ReferenceError: undefinedFunction is not defined
const undefinedCall = undefinedFunction()

// RangeError: Invalid array length
const invalidArray = new Array(-1)

// TypeError: Invalid arguments
const badMath = Math.sqrt(-1).toFixed('invalid')

// ✅ Proper error handling:

// Safe property access
const safeAccess = data?.someProperty?.anotherProperty ?? 'default'

// Check before calling
const safeCall = typeof myFunction === 'function' ? myFunction() : null

// Validate array length
const safeArray = length >= 0 ? new Array(length) : []

// Validate arguments
const safeMath = typeof precision === 'number' 
  ? Math.sqrt(Math.abs(value)).toFixed(precision)
  : 'Invalid input'

// Try-catch blocks
try {
  const result = riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  return fallbackValue
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
          background: #fee2e2;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid #dc2626;
        }

        .explanation h2 {
          margin: 0 0 1rem 0;
          color: #dc2626;
        }

        .explanation ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .explanation li {
          margin-bottom: 0.5rem;
          color: #7f1d1d;
        }

        .error-showcase {
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fef2f2;
        }

        .error-showcase h3 {
          margin: 0 0 1.5rem 0;
          color: #dc2626;
        }

        .error-item {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .error-item h4 {
          margin: 0 0 0.5rem 0;
          color: #991b1b;
          font-size: 1rem;
        }

        .error-content {
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          color: #374151;
          word-break: break-all;
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
        }
      `}</style>
    </div>
  )
} 