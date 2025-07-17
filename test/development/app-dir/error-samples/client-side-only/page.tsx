'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ClientSideOnlyPage() {
  const [triggerError, setTriggerError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // This will cause an error when called during SSR
  const accessWindowObject = () => {
    try {
      if (triggerError) {
        // This will throw "ReferenceError: window is not defined" on server
        const userAgent = window.navigator.userAgent
        const windowWidth = window.innerWidth
        return `User Agent: ${userAgent}, Width: ${windowWidth}`
      }
      return 'Safe - not accessing window'
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setErrorMessage(message)
      throw error
    }
  }

  const handleTriggerError = () => {
    setErrorMessage('')
    setTriggerError(!triggerError)
    
    if (!triggerError) {
      try {
        accessWindowObject()
      } catch (error) {
        console.error('Client-side error:', error)
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Client-Side Only Code Error</h1>
        <p>This page demonstrates errors from accessing browser APIs during server-side rendering</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>What causes client-side only errors?</h2>
          <ul>
            <li>Accessing `window`, `document`, or other browser APIs during SSR</li>
            <li>Using localStorage, sessionStorage on the server</li>
            <li>Browser-specific APIs called before component mounts</li>
            <li>Third-party libraries that assume browser environment</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {triggerError ? 'Error mode' : 'Safe mode'}</p>
            
            <div className="error-zone">
              <h4>Browser API Access:</h4>
              <div className="content-box">
                {triggerError ? (
                  <span style={{ color: '#dc2626' }}>
                    Trying to access window.navigator.userAgent...
                  </span>
                ) : (
                  'Not accessing browser APIs'
                )}
              </div>
              {errorMessage && (
                <div className="error-display">
                  Error: {errorMessage}
                </div>
              )}
            </div>

            <div className="controls">
              <button 
                onClick={handleTriggerError}
                className={`trigger-btn ${triggerError ? 'error' : 'safe'}`}
              >
                {triggerError ? 'Stop Error' : 'Access Window Object'}
              </button>
            </div>

            {triggerError && (
              <div className="warning">
                <strong>⚠️ Client-Side API Access Active</strong>
                <p>The code is trying to access `window.navigator.userAgent` which doesn't exist on the server.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code:</h3>
          <pre>{`// ❌ This fails during SSR
function BadComponent() {
  const userAgent = window.navigator.userAgent
  return <div>User Agent: {userAgent}</div>
}

// ❌ Also problematic
function AlsoBad() {
  const width = window.innerWidth
  return <div>Width: {width}</div>
}

// ✅ Correct approaches
function GoodComponent() {
  const [userAgent, setUserAgent] = useState('')
  
  useEffect(() => {
    setUserAgent(window.navigator.userAgent)
  }, [])
  
  return <div>User Agent: {userAgent}</div>
}

// ✅ Or check if window exists
function AlsoGood() {
  const width = typeof window !== 'undefined' 
    ? window.innerWidth 
    : 0
  
  return <div>Width: {width}</div>
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
          margin-bottom: 0.5rem;
        }

        .error-display {
          padding: 0.75rem;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #dc2626;
          font-family: monospace;
          font-size: 0.9rem;
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