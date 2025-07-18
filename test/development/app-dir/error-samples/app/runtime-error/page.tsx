'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../shared.css'

export default function RuntimeErrorPage() {
  const [errorTriggered, setErrorTriggered] = useState(false)
  const [lastError, setLastError] = useState<string>('')

  const triggerTypeError = () => {
    setErrorTriggered(true)
    setLastError('')
    try {
      // @ts-ignore - intentionally cause TypeError
      const result = null.someProperty.anotherProperty
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    }
  }

  

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Runtime Error Example</h1>
        <p>This page demonstrates a common JavaScript runtime error that occurs during execution</p>
      </header>

      <div className="content main-page">
        

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {errorTriggered ? 'TypeError triggered' : 'No error active'}</p>
            
            {lastError && (
              <div className="error-display">
                <h4>Last Error:</h4>
                <code>{lastError}</code>
              </div>
            )}

            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerTypeError} className="error-btn type">
                  Trigger TypeError
                </button>
                
              </div>
            </div>

            {errorTriggered && (
              <div className="warning">
                <strong>⚠️ TypeError Active</strong>
                <p>Check the dev tools console and error overlay for details. Click the auto-fix button to test the AI fixing feature.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Example Problem Code:</h3>
          <pre>{`// ❌ TypeError - accessing property of null
const user = null
const name = user.name // TypeError: Cannot read properties of null

// ❌ Common mistake
const data = null
const value = data.someProperty.anotherProperty

// ✅ Proper error handling
const user = null
const name = user?.name ?? 'Unknown' // Safe access with optional chaining

// ✅ Check before use
if (user && user.name) {
  console.log(user.name)
}

// ✅ Defensive programming
const getValue = (obj) => {
  return obj && obj.someProperty && obj.someProperty.anotherProperty
}`}</pre>
        </div>
      </div>
    </div>
  )
} 