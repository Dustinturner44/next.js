'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function InvalidHooksPage() {
  // This violates Rules of Hooks - hook after conditional logic
  if (Math.random() > 0.5) {
    // Some logic that might execute
  }
  
  // ❌ This hook call after conditional logic violates Rules of Hooks
  const [count, setCount] = useState(0)
  
  // ❌ Another violation - hook in a loop
  for (let i = 0; i < 1; i++) {
    // @ts-ignore - intentional hook violation
    const [loopState] = useState(`loop-${i}`)
  }
  
  // Function that violates hook rules
  const handleClick = () => {
    // ❌ Hook inside event handler - violates Rules of Hooks
    // @ts-ignore - intentional hook violation
    const [clickState] = useState('clicked')
    return clickState
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Invalid Hook Usage Errors</h1>
        <p>This page immediately violates React's Rules of Hooks</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>🔴 Active Hook Rule Violations</h2>
          <ul>
            <li>Hook called after conditional logic</li>
            <li>Hook called inside a loop</li>
            <li>Hook called inside event handler function</li>
            <li>Inconsistent hook call order</li>
          </ul>
        </div>

        <div className="error-showcase">
          <h3>Hook Violations Active on This Page</h3>
          
          <div className="error-item">
            <h4>Hook After Conditional:</h4>
            <div className="error-content">
              Count state: {count}
            </div>
          </div>

          <div className="error-item">
            <h4>Hook in Loop:</h4>
            <div className="error-content">
              Loop state initialized in for loop
            </div>
          </div>

          <div className="error-item">
            <h4>Hook in Event Handler:</h4>
            <div className="error-content">
              <button onClick={handleClick}>
                Click (has hook inside handler)
              </button>
            </div>
          </div>

          <div className="error-item">
            <h4>Conditional Hook Call:</h4>
            <div className="error-content">
              {/* This demonstrates conditional hook usage */}
              {Math.random() > 0.3 && (() => {
                // @ts-ignore - intentional hook violation
                const [conditionalState] = useState('conditional')
                return `Conditional: ${conditionalState}`
              })()}
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Currently Active):</h3>
          <pre>{`// ❌ These hook violations are active on this page:

// Hook after conditional logic
if (Math.random() > 0.5) {
  // Some logic
}
const [count, setCount] = useState(0) // Violation!

// Hook in loop
for (let i = 0; i < 1; i++) {
  const [loopState] = useState(\`loop-\${i}\`) // Violation!
}

// Hook in event handler
const handleClick = () => {
  const [clickState] = useState('clicked') // Violation!
  return clickState
}

// Conditional hook call
{Math.random() > 0.3 && (() => {
  const [conditionalState] = useState('conditional') // Violation!
  return conditionalState
})()}

// ✅ Correct hook usage:

function GoodComponent() {
  // All hooks at top level, before any conditionals
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')
  
  // Effects at top level
  useEffect(() => {
    // Side effects here
  }, [])
  
  // Conditional logic AFTER hooks
  if (someCondition) {
    return <div>Early return is OK</div>
  }
  
  // Event handlers without hooks
  const handleClick = () => {
    setCount(prev => prev + 1) // Use state setters, not hooks
  }
  
  return <div onClick={handleClick}>Count: {count}</div>
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

        .error-content button {
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
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