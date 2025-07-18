'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../shared.css'

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

      <div className="content main-page">
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
    </div>
  )
} 