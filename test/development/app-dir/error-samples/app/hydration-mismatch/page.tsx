'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HydrationMismatchPage() {
  const [isClient, setIsClient] = useState(false)
  const [triggerError, setTriggerError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // This will cause hydration mismatch when triggerError is true
  const getRandomContent = () => {
    if (triggerError) {
      return Math.random() > 0.5 ? 'Server Content' : 'Client Content'
    }
    return 'Safe Content'
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Hydration Mismatch Error</h1>
        <p>This page demonstrates hydration mismatch errors where server and client render different content</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>What causes hydration mismatch?</h2>
          <ul>
            <li>Different content rendered on server vs client</li>
            <li>Using random values, dates, or client-side data during SSR</li>
            <li>Conditional rendering based on browser APIs</li>
            <li>Inconsistent component trees between server and client</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {triggerError ? 'Error mode' : 'Safe mode'}</p>
            
            <div className="error-zone">
              <h4>Content Area:</h4>
              <div className="content-box">
                {triggerError ? getRandomContent() : 'Consistent content'}
              </div>
            </div>

            <div className="controls">
              <button 
                onClick={() => setTriggerError(!triggerError)}
                className={`trigger-btn ${triggerError ? 'error' : 'safe'}`}
              >
                {triggerError ? 'Stop Error' : 'Trigger Hydration Mismatch'}
              </button>
            </div>

            {triggerError && (
              <div className="warning">
                <strong>⚠️ Hydration Mismatch Active</strong>
                <p>Check the console for hydration errors. The content above changes randomly on each render.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code:</h3>
          <pre>{`// ❌ This causes hydration mismatch
function BadComponent() {
  return (
    <div>
      {Math.random() > 0.5 ? 'Server' : 'Client'}
    </div>
  )
}

// ✅ Correct approach
function GoodComponent() {
  const [content, setContent] = useState('Loading...')
  
  useEffect(() => {
    setContent(Math.random() > 0.5 ? 'Server' : 'Client')
  }, [])
  
  return <div>{content}</div>
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

        .error-zone {
          margin: 1rem 0;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fafafa;
        }

        .error-zone h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .content-box {
          padding: 1rem;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-weight: 600;
          text-align: center;
        }

        .controls {
          margin: 1.5rem 0;
          text-align: center;
        }

        .trigger-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .trigger-btn.safe {
          background: #dc2626;
          color: white;
        }

        .trigger-btn.safe:hover {
          background: #b91c1c;
        }

        .trigger-btn.error {
          background: #059669;
          color: white;
        }

        .trigger-btn.error:hover {
          background: #047857;
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
        }
      `}</style>
    </div>
  )
} 