'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function InvalidHooksPage() {
  const [errorType, setErrorType] = useState<string | null>(null)
  const [showConditional, setShowConditional] = useState(false)

  // This function demonstrates invalid hook usage
  const triggerConditionalHook = () => {
    setErrorType('Conditional Hook')
    try {
      // ❌ This violates rules of hooks - hooks cannot be called conditionally
      if (showConditional) {
        // @ts-ignore
        const [localState] = useState('conditional state')
      }
    } catch (error) {
      throw error
    }
  }

  // This function demonstrates hook in loop
  const triggerLoopHook = () => {
    setErrorType('Hook in Loop')
    try {
      // ❌ This violates rules of hooks - hooks cannot be called in loops
      for (let i = 0; i < 3; i++) {
        // @ts-ignore
        const [loopState] = useState(`state-${i}`)
      }
    } catch (error) {
      throw error
    }
  }

  // This function demonstrates hook in nested function
  const triggerNestedHook = () => {
    setErrorType('Hook in Nested Function')
    try {
      // ❌ This violates rules of hooks - hooks cannot be called in nested functions
      const nestedFunction = () => {
        // @ts-ignore
        const [nestedState] = useState('nested state')
      }
      nestedFunction()
    } catch (error) {
      throw error
    }
  }

  // This demonstrates hook after early return
  const triggerHookAfterReturn = () => {
    setErrorType('Hook After Early Return')
    
    if (true) {
      // Some condition that causes early return
      return
    }
    
    // ❌ This hook would never be reached consistently
    // @ts-ignore
    const [unreachableState] = useState('unreachable')
  }

  const clearError = () => {
    setErrorType(null)
    setShowConditional(false)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Invalid Hook Usage Errors</h1>
        <p>This page demonstrates violations of React's Rules of Hooks</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>Rules of Hooks</h2>
          <ul>
            <li><strong>Only call hooks at the top level:</strong> Don't call hooks inside loops, conditions, or nested functions</li>
            <li><strong>Only call hooks from React functions:</strong> Call hooks from React function components or custom hooks</li>
            <li><strong>Hooks must be called in the same order every time:</strong> This ensures React can correctly preserve hook state</li>
            <li><strong>Don't call hooks after early returns:</strong> Hooks must be called before any possible return statement</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {errorType ? `${errorType} error triggered` : 'No error active'}</p>
            
            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerConditionalHook} className="error-btn conditional">
                  Conditional Hook
                </button>
                <button onClick={triggerLoopHook} className="error-btn loop">
                  Hook in Loop
                </button>
                <button onClick={triggerNestedHook} className="error-btn nested">
                  Nested Hook
                </button>
                <button onClick={triggerHookAfterReturn} className="error-btn return">
                  Hook After Return
                </button>
                <button onClick={clearError} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>

            {errorType && (
              <div className="warning">
                <strong>⚠️ {errorType} Error Active</strong>
                <p>This violates React's Rules of Hooks. Check the console for the specific error message.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Hook Rules Violations & Fixes:</h3>
          <pre>{`// ❌ Don't call hooks conditionally
function BadComponent({ condition }) {
  if (condition) {
    const [state, setState] = useState(0) // Error!
  }
  return <div>Hello</div>
}

// ✅ Always call hooks at top level
function GoodComponent({ condition }) {
  const [state, setState] = useState(0)
  
  if (condition) {
    // Use the hook result conditionally instead
    setState(prev => prev + 1)
  }
  
  return <div>Hello</div>
}

// ❌ Don't call hooks in loops
function BadList({ items }) {
  return items.map((item, index) => {
    const [selected, setSelected] = useState(false) // Error!
    return <div key={index}>{item}</div>
  })
}

// ✅ Create separate components for each item
function ListItem({ item }) {
  const [selected, setSelected] = useState(false)
  return <div>{item}</div>
}

function GoodList({ items }) {
  return items.map((item, index) => (
    <ListItem key={index} item={item} />
  ))
}

// ❌ Don't call hooks in nested functions
function BadComponent() {
  const handleClick = () => {
    const [count, setCount] = useState(0) // Error!
  }
  
  return <button onClick={handleClick}>Click</button>
}

// ✅ Call hooks at component level
function GoodComponent() {
  const [count, setCount] = useState(0)
  
  const handleClick = () => {
    setCount(prev => prev + 1)
  }
  
  return <button onClick={handleClick}>Count: {count}</button>
}

// ❌ Don't call hooks after early returns
function BadComponent({ shouldReturn }) {
  if (shouldReturn) {
    return <div>Early return</div>
  }
  
  const [state, setState] = useState(0) // Error! Not always called
  return <div>Normal render</div>
}

// ✅ Call all hooks before any returns
function GoodComponent({ shouldReturn }) {
  const [state, setState] = useState(0)
  
  if (shouldReturn) {
    return <div>Early return</div>
  }
  
  return <div>Normal render: {state}</div>
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
          font-size: 0.9rem;
        }

        .error-btn.conditional {
          background: #dc2626;
        }

        .error-btn.conditional:hover {
          background: #b91c1c;
        }

        .error-btn.loop {
          background: #ea580c;
        }

        .error-btn.loop:hover {
          background: #c2410c;
        }

        .error-btn.nested {
          background: #059669;
        }

        .error-btn.nested:hover {
          background: #047857;
        }

        .error-btn.return {
          background: #7c3aed;
        }

        .error-btn.return:hover {
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