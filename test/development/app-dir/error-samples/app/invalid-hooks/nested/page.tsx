'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../../shared.css'

export default function NestedHookPage() {
  // This creates a dynamic condition that will cause hook calls in nested functions
  const [shouldCallNested, setShouldCallNested] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  
  // ❌ This violates rules of hooks - hooks cannot be called in nested functions
  const triggerNestedHook = () => {
    if (shouldCallNested) {
      // This hook call in a nested function will cause React to throw an error
      const [nestedState] = useState('This hook is called in a nested function!')
      console.log('Nested hook state:', nestedState)
      return nestedState
    }
    return 'No nested hook called'
  }

  // Force a re-render and toggle the nested hook call
  const toggleNestedHook = () => {
    setRenderCount(prev => prev + 1)
    setShouldCallNested(prev => !prev)
    // Try to call the nested function that contains hooks
    try {
      const result = triggerNestedHook()
      console.log('Nested function result:', result)
    } catch (error) {
      console.error('Nested hook error:', error)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/invalid-hooks" className="back-link">← Back to Hook Examples</Link>
        <h1>Nested Hook Error</h1>
        <p>This page demonstrates calling a hook inside a nested function</p>
      </header>

      <div className="content">
        <div className="error-alert">
          <h2>⚠️ Hook Violation Detected</h2>
          <p>This page contains a hook that is called inside a nested function, which violates React's Rules of Hooks.</p>
          <p>Click the button below to trigger the error by calling hooks in nested functions.</p>
        </div>

        <div className="demo">
          <h3>Trigger the Error</h3>
          <div className="demo-content">
            <p>Will call nested hook: {shouldCallNested ? 'Yes' : 'No'}</p>
            <p>Render count: {renderCount}</p>
            
            <div className="controls">
              <button onClick={toggleNestedHook} className="error-btn nested">
                Toggle Nested Hook (Trigger Error)
              </button>
            </div>
            
            <div className="warning">
              <strong>⚠️ Rules of Hooks Violation</strong>
              <p>This will cause React to throw an error because hooks are called inside nested functions.</p>
            </div>
          </div>
        </div>

        <div className="explanation">
          <h3>What's Wrong?</h3>
          <p>
            The hook <code>useState</code> is being called inside a nested function.
            React hooks must only be called at the top level of React function components,
            not inside regular JavaScript functions, event handlers, or other nested functions.
          </p>
        </div>

        <div className="code-section">
          <h3>Problematic Code:</h3>
          <pre className="code-block error">{`function NestedHookPage() {
  const triggerNestedHook = () => {
    // ❌ This violates rules of hooks
    const [nestedState] = useState('nested!')
    return nestedState
  }

  const result = triggerNestedHook()
  
  return <div>{result}</div>
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Correct Approach - Move Hook to Top Level:</h3>
          <pre className="code-block success">{`function NestedHookPage() {
  // ✅ Call hook at the top level
  const [state, setState] = useState('initial')
  
  const handleAction = () => {
    // ✅ Use the state setter instead
    setState('updated!')
  }

  return (
    <div>
      <p>{state}</p>
      <button onClick={handleAction}>Update</button>
    </div>
  )
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Custom Hook Approach:</h3>
          <pre className="code-block success">{`// ✅ Create a custom hook
function useNestedLogic() {
  const [state, setState] = useState('initial')
  
  const updateState = () => {
    setState('updated from custom hook!')
  }
  
  return { state, updateState }
}

function NestedHookPage() {
  // ✅ Use the custom hook at top level
  const { state, updateState } = useNestedLogic()
  
  return (
    <div>
      <p>{state}</p>
      <button onClick={updateState}>Update</button>
    </div>
  )
}`}</pre>
        </div>

        <div className="tips">
          <h3>Key Points:</h3>
          <ul>
            <li>Only call hooks at the top level of React function components</li>
            <li>Never call hooks inside regular JavaScript functions</li>
            <li>Use state setters inside event handlers and nested functions</li>
            <li>Create custom hooks to encapsulate reusable stateful logic</li>
            <li>Custom hooks must also follow the rules of hooks</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 