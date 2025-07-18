'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../shared.css'

export default function AsyncErrorsPage() {
  const [errorType, setErrorType] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const triggerJSONParseError = async () => {
    setErrorType('JSON Parse Error')
    setLastError('')
    setIsLoading(true)
    
    try {
      // Simulate receiving malformed JSON
      const malformedJSON = '{"name": "John", "age": 30, "city": "New York"' // Missing closing brace
      const result = JSON.parse(malformedJSON)
      console.log('Parsed JSON:', result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const triggerNetworkError = async () => {
    setErrorType('Network Error')
    setLastError('')
    setIsLoading(true)
    
    try {
      // Attempt to fetch from a non-existent endpoint
      const response = await fetch('https://nonexistent-api-endpoint-12345.com/data')
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Network data:', data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const triggerAsyncAwaitError = async () => {
    setErrorType('Async/Await Error')
    setLastError('')
    setIsLoading(true)
    
    try {
      // Create a promise that rejects
      const failingPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Simulated async operation failed'))
        }, 100)
      })
      
      const result = await failingPromise
      console.log('Async result:', result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const triggerPromiseRejection = () => {
    setErrorType('Unhandled Promise Rejection')
    setLastError('')
    
    // Create an unhandled promise rejection
    const unhandledPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Unhandled promise rejection - this will show in console'))
      }, 100)
    })
    
    // Intentionally not handling the rejection
    unhandledPromise.then(result => {
      console.log('This should not run:', result)
    })
    // Missing .catch() handler
    
    setLastError('Check console for unhandled promise rejection warning')
  }

  const triggerTimeoutError = async () => {
    setErrorType('Timeout Error')
    setLastError('')
    setIsLoading(true)
    
    try {
      // Simulate a request that times out
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out after 2 seconds'))
        }, 2000)
      })
      
      const dataPromise = new Promise(resolve => {
        // This would normally resolve with data, but takes too long
        setTimeout(() => resolve('Late data'), 5000)
      })
      
      // Race between timeout and data - timeout will win
      const result = await Promise.race([dataPromise, timeoutPromise])
      console.log('Result:', result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLastError(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setErrorType(null)
    setLastError('')
    setIsLoading(false)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Async & Network Error Examples</h1>
        <p>This page demonstrates common runtime errors with async operations, JSON parsing, and network requests</p>
      </header>

      <div className="content main-page">
        <div className="explanation">
          <h2>Common Async Runtime Errors</h2>
          <ul>
            <li><strong>JSON Parse Errors:</strong> Malformed JSON data causing parse failures</li>
            <li><strong>Network Errors:</strong> Failed HTTP requests, CORS issues, or connectivity problems</li>
            <li><strong>Async/Await Errors:</strong> Unhandled rejections in async functions</li>
            <li><strong>Promise Rejections:</strong> Unhandled promise rejections causing warnings</li>
            <li><strong>Timeout Errors:</strong> Operations that exceed expected time limits</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {errorType ? `${errorType} triggered` : 'No error active'}</p>
            {isLoading && <p>⏳ Loading...</p>}
            
            {lastError && (
              <div className="error-display">
                <h4>Last Error:</h4>
                <code>{lastError}</code>
              </div>
            )}

            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerJSONParseError} className="error-btn" disabled={isLoading}>
                  JSON Parse Error
                </button>
                <button onClick={triggerNetworkError} className="error-btn" disabled={isLoading}>
                  Network Error
                </button>
                <button onClick={triggerAsyncAwaitError} className="error-btn" disabled={isLoading}>
                  Async/Await Error
                </button>
                <button onClick={triggerPromiseRejection} className="error-btn" disabled={isLoading}>
                  Promise Rejection
                </button>
                <button onClick={triggerTimeoutError} className="error-btn" disabled={isLoading}>
                  Timeout Error
                </button>
                <button onClick={clearError} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>

            {errorType && (
              <div className="warning">
                <strong>⚠️ {errorType} Active</strong>
                <p>Check the dev tools console and error overlay for details. These represent real-world async operation failures.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Example Problem Code:</h3>
          <pre>{`// ❌ JSON Parse Error - malformed JSON
const malformedJSON = '{"name": "John", "age": 30'
const data = JSON.parse(malformedJSON) // SyntaxError

// ❌ Network Error - no error handling
const response = await fetch('/api/nonexistent')
const data = await response.json() // May fail

// ❌ Unhandled Promise Rejection
const promise = fetch('/api/data')
promise.then(response => response.json()) // Missing .catch()

// ❌ Async/Await without try-catch
async function fetchData() {
  const response = await fetch('/api/data')
  return response.json() // Will throw if response.json() fails
}

// ✅ Proper Error Handling
async function safeFetchData() {
  try {
    const response = await fetch('/api/data')
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error // Re-throw if needed
  }
}

// ✅ Safe JSON parsing
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Invalid JSON:', error.message)
    return null
  }
}`}</pre>
        </div>
      </div>
    </div>
  )
} 