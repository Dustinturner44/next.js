'use client'

import Link from 'next/link'
import '../shared.css'

export default function HydrationMismatchPage() {


  // ❌ This creates a hydration mismatch - different content on server vs client
  const getContentWithHydrationMismatch = () => {
    return typeof window === 'undefined' ? 'Server Content' : `Client Content - ${Date.now()}`
  }

  // ❌ Another hydration mismatch example with random values
  const getRandomContent = () => {
    return `Random: ${Math.random()}`
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Hydration Mismatch Error</h1>
        <p>This page demonstrates hydration mismatch errors where server and client render different content</p>
      </header>

      <div className="content main-page">
        
        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            
            <div className="error-zone">
              <h4>Hydration Mismatch Areas:</h4>
              <div className="content-box">
                <p><strong>Area 1:</strong> {getContentWithHydrationMismatch()}</p>
                <p><strong>Area 2:</strong> {getRandomContent()}</p>
              </div>
            </div>

            
            
          </div>
        </div>

        <div className="code-example">
          <h3>❌ Problem Code (Causes Hydration Mismatch):</h3>
          <pre>{`// Server renders one thing, client renders another
function BadComponent() {
  return (
    <div>
      <p>Server time: {new Date().toISOString()}</p>
      <p>Random: {Math.random()}</p>
      <p>Window exists: {typeof window !== 'undefined'}</p>
    </div>
  )
}

// This causes hydration mismatch because:
// - Server: renders with server timestamp
// - Client: renders with different client timestamp
// - Server: window is undefined
// - Client: window exists`}</pre>
        </div>

        <div className="code-example">
          <h3>✅ Correct Approach (No Hydration Mismatch):</h3>
          <pre>{`function GoodComponent() {
  const [clientData, setClientData] = useState('')
  const [timestamp, setTimestamp] = useState('')
  
  useEffect(() => {
    // Only run on client after hydration
    setTimestamp(new Date().toISOString())
    setClientData(\`Random: \${Math.random()}\`)
  }, [])
  
  return (
    <div>
      <p>Timestamp: {timestamp || 'Loading...'}</p>
      <p>{clientData || 'Loading...'}</p>
      <p>Window available: {clientData ? 'Yes' : 'Loading...'}</p>
    </div>
  )
}

// Alternative: Use dynamic imports
const ClientOnlyComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
)`}</pre>
        </div>

        <div className="tips">
          <h3>Fix Hydration Mismatches:</h3>
          <ul>
            <li>Use <code>useEffect</code> for client-only code</li>
            <li>Initialize with consistent server-safe values</li>
            <li>Use <code>dynamic</code> imports with <code>ssr: false</code></li>
            <li>Avoid <code>Math.random()</code>, <code>Date.now()</code> in render</li>
            <li>Check <code>typeof window !== 'undefined'</code> carefully</li>
            <li>Use suppressHydrationWarning sparingly for specific cases</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 