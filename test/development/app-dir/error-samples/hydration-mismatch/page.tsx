'use client'

import Link from 'next/link'

export default function HydrationMismatchPage() {
  // This will cause immediate hydration mismatch
  // Server renders "Server-side", client renders "Client-side"
  const content = typeof window === 'undefined' ? 'Server-side' : 'Client-side'
  
  // Additional hydration mismatches
  const timestamp = new Date().toISOString()
  const randomId = Math.floor(Math.random() * 1000)
  
  return (
    <div className="container">
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Hydration Mismatch Error</h1>
        <p>This page immediately triggers hydration mismatch errors</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>Active Hydration Mismatches on This Page</h2>
          <ul>
            <li>Server/client detection using typeof window</li>
            <li>Timestamp generation during render</li>
            <li>Random values in component render</li>
            <li>Math.random() calls during SSR</li>
          </ul>
        </div>

        <div className="error-showcase">
          <h3>🔴 Live Hydration Errors</h3>
          
          <div className="error-item">
            <h4>Window Detection Mismatch:</h4>
            <div className="error-content">
              Environment: {content}
            </div>
          </div>

          <div className="error-item">
            <h4>Timestamp Mismatch:</h4>
            <div className="error-content">
              Generated: {timestamp}
            </div>
          </div>

          <div className="error-item">
            <h4>Random ID Mismatch:</h4>
            <div className="error-content">
              ID: component-{randomId}
            </div>
          </div>

          <div className="error-item">
            <h4>Direct Math.random() Mismatch:</h4>
            <div className="error-content">
              Value: {Math.random().toFixed(4)}
            </div>
          </div>

          <div className="error-item">
            <h4>Conditional Browser API:</h4>
            <div className="error-content">
              User Agent: {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 30) + '...' : 'Server Environment'}
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Currently Active):</h3>
          <pre>{`// ❌ This page contains these hydration mismatches:

// Window detection (active above)
const content = typeof window === 'undefined' ? 'Server-side' : 'Client-side'

// Timestamp during render (active above)  
const timestamp = new Date().toISOString()

// Random values (active above)
const randomId = Math.floor(Math.random() * 1000)

// Direct Math.random() in JSX (active above)
<div>Value: {Math.random().toFixed(4)}</div>

// Browser API conditional (active above)
{typeof window !== 'undefined' ? navigator.userAgent : 'Server Environment'}

// ✅ Correct approaches:

// Use useEffect for client-only content
const [content, setContent] = useState('Loading...')
useEffect(() => {
  setContent(typeof window === 'undefined' ? 'Server-side' : 'Client-side')
}, [])

// Use useEffect for timestamps
const [timestamp, setTimestamp] = useState('')
useEffect(() => {
  setTimestamp(new Date().toISOString())
}, [])

// Use useEffect for random values
const [randomId, setRandomId] = useState('')
useEffect(() => {
  setRandomId(\`component-\${Math.floor(Math.random() * 1000)}\`)
}, [])`}</pre>
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