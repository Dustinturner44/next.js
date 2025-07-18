'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../../shared.css'

export default function ConditionalHookPage() {
  // This creates a dynamic condition that will cause inconsistent hook calls
  const [triggerError, setTriggerError] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  
  // Force a re-render to trigger the hook violation
  const forceUpdate = () => {
    setRenderCount(prev => prev + 1)
    setTriggerError(prev => !prev)
  }
  
  // ❌ This violates rules of hooks - hooks called conditionally based on dynamic state
  if (triggerError) {
    // This hook will only be called sometimes, violating Rules of Hooks
    const [conditionalState] = useState('This hook is called conditionally!')
    console.log('Conditional hook state:', conditionalState)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/invalid-hooks" className="back-link">← Back to Hook Examples</Link>
        <h1>Conditional Hook Error</h1>
        <p>This page demonstrates calling a hook inside an if statement</p>
      </header>

      <div className="content">
        <div className="error-alert">
          <h2>⚠️ Hook Violation Detected</h2>
          <p>This page contains a hook that is called conditionally, which violates React's Rules of Hooks.</p>
          <p>Click the button below to trigger the error by changing hook call order between renders.</p>
        </div>

        <div className="demo">
          <h3>Trigger the Error</h3>
          <div className="demo-content">
            <p>Current status: {triggerError ? 'Hook will be called' : 'Hook will be skipped'}</p>
            <p>Render count: {renderCount}</p>
            
            <div className="controls">
              <button onClick={forceUpdate} className="error-btn conditional">
                Toggle Conditional Hook (Trigger Error)
              </button>
            </div>
            
            <div className="warning">
              <strong>⚠️ Rules of Hooks Violation</strong>
              <p>This will cause React to throw an error because hooks are called in different orders between renders.</p>
            </div>
          </div>
        </div>

        <div className="explanation">
          <h3>What's Wrong?</h3>
          <p>
            The hook <code>useState</code> is being called inside an <code>if</code> statement that depends on dynamic state.
            This means the hook is called conditionally - sometimes it runs, sometimes it doesn't.
            This breaks React's expectation that hooks are called in the same order every time.
          </p>
        </div>

        <div className="code-section">
          <h3>Problematic Code:</h3>
          <pre className="code-block error">{`function ConditionalHookPage() {
  const [triggerError, setTriggerError] = useState(false)
  
  // ❌ This violates rules of hooks
  if (triggerError) {
    const [conditionalState] = useState('conditional!')
  }

  return <div>Content</div>
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Correct Approach:</h3>
          <pre className="code-block success">{`function ConditionalHookPage() {
  // ✅ Always call hooks at the top level
  const [triggerError, setTriggerError] = useState(false)
  const [state, setState] = useState('default')
  
  // Use the hook result conditionally instead
  const displayValue = triggerError ? state : 'default'

  return <div>{displayValue}</div>
}`}</pre>
        </div>

        <div className="tips">
          <h3>Key Points:</h3>
          <ul>
            <li>Always call hooks at the top level of your function</li>
            <li>Never call hooks inside conditions, loops, or nested functions</li>
            <li>Use the hook results conditionally, not the hooks themselves</li>
            <li>This ensures hooks are called in the same order every render</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 