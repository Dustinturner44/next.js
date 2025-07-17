'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HydrationMismatchPage() {
  const [safeMode, setSafeMode] = useState(false)
  
  // This will cause hydration mismatch immediately on render
  // Server will render one value, client will render a different value
  const getRandomContent = () => {
    if (safeMode) {
      return 'Safe Content - No Hydration Error'
    }
    // This causes immediate hydration mismatch
    return `Random: ${Math.random()}`
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Hydration Mismatch Error</h1>
        <p>This page automatically triggers hydration mismatch errors on render</p>
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
          <h3>Live Hydration Mismatch Demo</h3>
          <div className="demo-content">
            <p>Status: {safeMode ? 'Safe mode (no error)' : 'Hydration mismatch active!'}</p>
            
            <div className="error-zone">
              <h4>Content Area (Check Console for Errors):</h4>
              <div className="content-box">
                {getRandomContent()}
              </div>
              
              {!safeMode && (
                <div className="live-error-display">
                  <strong>🔴 Active Hydration Mismatch</strong>
                  <p>The content above shows different values on server vs client render, causing a hydration error.</p>
                </div>
              )}
            </div>

            <div className="controls">
              <button 
                onClick={() => setSafeMode(!safeMode)}
                className={`trigger-btn ${safeMode ? 'safe' : 'error'}`}
              >
                {safeMode ? 'Enable Hydration Error' : 'Fix Hydration Error'}
              </button>
            </div>

            <div className="automatic-trigger">
              <h4>Additional Hydration Mismatches:</h4>
              <div className="mismatch-examples">
                <div className="example">
                  <strong>Date-based mismatch:</strong>
                  <div className="example-content">
                    {safeMode ? 'Static date' : `Generated at: ${new Date().toISOString()}`}
                  </div>
                </div>
                
                <div className="example">
                  <strong>Browser-based mismatch:</strong>
                  <div className="example-content">
                    {safeMode ? 'Static user agent' : `User Agent: ${typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'Server'}`}
                  </div>
                </div>
                
                <div className="example">
                  <strong>Random ID mismatch:</strong>
                  <div className="example-content">
                    {safeMode ? 'static-id' : `id-${Math.floor(Math.random() * 1000)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Active on this page):</h3>
          <pre>{`// ❌ This causes hydration mismatch (currently active)
function BadComponent() {
  return (
    <div>
      Random: {Math.random()}
    </div>
  )
}

// ❌ Date-based mismatch
function AlsoBad() {
  return <div>Time: {new Date().toISOString()}</div>
}

// ❌ Browser API mismatch
function StillBad() {
  return (
    <div>
      Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'Server'}
    </div>
  )
}

// ✅ Correct approach
function GoodComponent() {
  const [content, setContent] = useState('Loading...')
  
  useEffect(() => {
    setContent(\`Random: \${Math.random()}\`)
  }, [])
  
  return <div>{content}</div>
}

// ✅ Safe client-only rendering
function AlsoGood() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return <div>Loading...</div>
  
  return <div>Time: {new Date().toISOString()}</div>
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
          margin-bottom: 1rem;
        }

        .live-error-display {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 1rem;
          border-left: 4px solid #dc2626;
        }

        .live-error-display strong {
          color: #dc2626;
        }

        .live-error-display p {
          margin: 0.5rem 0 0 0;
          color: #7f1d1d;
        }

        .automatic-trigger {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .automatic-trigger h4 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .mismatch-examples {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .example {
          padding: 0.75rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .example strong {
          color: #374151;
          display: block;
          margin-bottom: 0.25rem;
        }

        .example-content {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          color: #6b7280;
          word-break: break-all;
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

          .mismatch-examples {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
} 