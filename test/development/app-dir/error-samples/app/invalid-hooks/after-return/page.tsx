'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../../shared.css'

export default function AfterReturnHookPage() {
  // This creates a dynamic condition that will cause early returns
  const [shouldEarlyReturn, setShouldEarlyReturn] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  
  // Force a re-render and toggle the early return condition
  const toggleEarlyReturn = () => {
    setRenderCount(prev => prev + 1)
    setShouldEarlyReturn(prev => !prev)
  }

  // ❌ This violates rules of hooks - conditional early return before hooks
  if (shouldEarlyReturn) {
    // This early return will cause hooks below to be skipped sometimes
    return (
      <div className="container">
        <header className="header">
          <Link href="/invalid-hooks" className="back-link">← Back to Hook Examples</Link>
          <h1>Early Return - No Hooks Called</h1>
        </header>
        <div className="content">
          <div className="error-alert">
            <h2>⚠️ Early Return Active</h2>
            <p>This render took an early return, skipping the hooks below.</p>
            <button onClick={toggleEarlyReturn} className="error-btn">
              Remove Early Return (This Will Trigger Hook Error)
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // ❌ These hooks come after the conditional early return
  // When shouldEarlyReturn changes, these hooks are sometimes called and sometimes not
  const [hookAfterReturn] = useState('This hook comes after potential early return!')
  const [anotherHook] = useState('Another hook that may be skipped!')
  
  console.log('Hooks called:', hookAfterReturn, anotherHook)

  return (
    <div className="container">
      <header className="header">
        <Link href="/invalid-hooks" className="back-link">← Back to Hook Examples</Link>
        <h1>Hook After Return Error</h1>
        <p>This page demonstrates calling a hook after an early return</p>
      </header>

      <div className="content">
        <div className="error-alert">
          <h2>⚠️ Hook Violation Detected</h2>
          <p>This page contains hooks that come after a potential early return, which violates React's Rules of Hooks.</p>
          <p>Click the button below to trigger the error by changing between early return and normal execution.</p>
        </div>

        <div className="demo">
          <h3>Trigger the Error</h3>
          <div className="demo-content">
            <p>Early return mode: {shouldEarlyReturn ? 'Active' : 'Inactive'}</p>
            <p>Render count: {renderCount}</p>
            <p>Hook values: {hookAfterReturn}, {anotherHook}</p>
            
            <div className="controls">
              <button onClick={toggleEarlyReturn} className="error-btn after-return">
                Toggle Early Return (Trigger Error)
              </button>
            </div>
            
            <div className="warning">
              <strong>⚠️ Rules of Hooks Violation</strong>
              <p>This will cause React to throw an error because hooks are sometimes called and sometimes skipped due to early returns.</p>
            </div>
          </div>
        </div>

        <div className="explanation">
          <h3>What's Wrong?</h3>
          <p>
            The hooks <code>useState</code> are being called after a conditional block that can cause an early return.
            When the condition changes, sometimes the hooks are called and sometimes they're skipped entirely,
            which breaks React's expectation that hooks are called in the same order every time.
          </p>
        </div>

        <div className="code-section">
          <h3>Problematic Code:</h3>
          <pre className="code-block error">{`function AfterReturnHookPage() {
  const [shouldEarlyReturn, setShouldEarlyReturn] = useState(false)
  
  if (shouldEarlyReturn) {
    return <div>Early return</div>
  }
  
  // ❌ These hooks might not be called consistently
  const [hookAfterReturn] = useState('unreachable!')
  const [anotherHook] = useState('also unreachable!')

  return <div>Normal render</div>
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Correct Approach - Hooks First:</h3>
          <pre className="code-block success">{`function AfterReturnHookPage() {
  // ✅ Call all hooks at the very top
  const [shouldEarlyReturn, setShouldEarlyReturn] = useState(false)
  const [state, setState] = useState('initial')
  const [anotherState, setAnotherState] = useState('another')
  
  if (shouldEarlyReturn) {
    // Now it's safe to return early - all hooks were called
    return <div>Early return: {state}</div>
  }

  return <div>Normal render: {state}, {anotherState}</div>
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Safe Conditional Rendering:</h3>
          <pre className="code-block success">{`function AfterReturnHookPage() {
  // ✅ All hooks called first
  const [showSpecial, setShowSpecial] = useState(false)
  const [state, setState] = useState('initial')
  
  // ✅ Use conditional rendering instead of early returns
  return (
    <div>
      {showSpecial ? (
        <SpecialComponent state={state} />
      ) : (
        <NormalComponent state={state} />
      )}
    </div>
  )
}`}</pre>
        </div>

        <div className="tips">
          <h3>Key Points:</h3>
          <ul>
            <li>Always call all hooks at the very top of your component</li>
            <li>Never call hooks after any conditional logic that might return</li>
            <li>Use conditional rendering instead of early returns when possible</li>
            <li>If you must return early, ensure all hooks are called first</li>
            <li>React needs to call the same hooks in the same order every time</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 