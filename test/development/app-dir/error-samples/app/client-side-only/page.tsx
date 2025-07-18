import { useState } from 'react'
import Link from 'next/link'
import '../shared.css'

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

      <div className="content main-page">
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
    </div>
  )
} 