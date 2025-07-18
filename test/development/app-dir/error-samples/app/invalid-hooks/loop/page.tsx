'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../../shared.css'

export default function LoopHookPage() {
  // This creates a dynamic loop count that will cause inconsistent hook calls
  const [loopCount, setLoopCount] = useState(1)
  const [renderCount, setRenderCount] = useState(0)
  
  // Force a re-render with different loop count to trigger the hook violation
  const changeLoopCount = () => {
    setRenderCount(prev => prev + 1)
    setLoopCount(prev => prev === 1 ? 2 : 1) // Toggle between 1 and 2
  }
  
  // ❌ This violates rules of hooks - different number of hooks called each render
  for (let i = 0; i < loopCount; i++) {
    // This hook will be called a different number of times on each render
    const [loopState] = useState(`state-${i}`)
    console.log('Loop hook state:', loopState)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/invalid-hooks" className="back-link">← Back to Hook Examples</Link>
        <h1>Hook in Loop Error</h1>
        <p>This page demonstrates calling a hook inside a for loop</p>
      </header>

      <div className="content">
        <div className="error-alert">
          <h2>⚠️ Hook Violation Detected</h2>
          <p>This page contains hooks that are called inside a loop, which violates React's Rules of Hooks.</p>
          <p>Click the button below to trigger the error by changing the number of hook calls between renders.</p>
        </div>

        <div className="demo">
          <h3>Trigger the Error</h3>
          <div className="demo-content">
            <p>Current loop count: {loopCount} (calling useState {loopCount} times)</p>
            <p>Render count: {renderCount}</p>
            
            <div className="controls">
              <button onClick={changeLoopCount} className="error-btn loop">
                Change Loop Count (Trigger Error)
              </button>
            </div>
            
            <div className="warning">
              <strong>⚠️ Rules of Hooks Violation</strong>
              <p>This will cause React to throw an error because different numbers of hooks are called between renders.</p>
            </div>
          </div>
        </div>

        <div className="explanation">
          <h3>What's Wrong?</h3>
          <p>
            The hook <code>useState</code> is being called inside a <code>for</code> loop with a dynamic count.
            This means a different number of hooks are called on each render depending on the loop condition,
            which breaks React's expectation that hooks are called in the same order and quantity every time.
          </p>
        </div>

        <div className="code-section">
          <h3>Problematic Code:</h3>
          <pre className="code-block error">{`function LoopHookPage() {
  const [loopCount, setLoopCount] = useState(1)
  
  // ❌ This violates rules of hooks
  for (let i = 0; i < loopCount; i++) {
    const [loopState] = useState(\`state-\${i}\`)
  }

  return <div>Content</div>
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Correct Approach - Use Separate Components:</h3>
          <pre className="code-block success">{`function LoopItem({ index }) {
  // ✅ Each component instance has its own hook
  const [state, setState] = useState(\`state-\${index}\`)
  return <div>{state}</div>
}

function LoopHookPage() {
  const [count, setCount] = useState(1)
  const items = Array.from({ length: count }, (_, i) => i)
  
  return (
    <div>
      {items.map(index => (
        <LoopItem key={index} index={index} />
      ))}
    </div>
  )
}`}</pre>
        </div>

        <div className="code-section">
          <h3>Alternative - Use Array State:</h3>
          <pre className="code-block success">{`function LoopHookPage() {
  // ✅ Single hook manages array of states
  const [states, setStates] = useState(['state-0'])
  
  const addState = () => {
    setStates(prev => [...prev, \`state-\${prev.length}\`])
  }

  return (
    <div>
      {states.map((state, index) => (
        <div key={index}>{state}</div>
      ))}
      <button onClick={addState}>Add Item</button>
    </div>
  )
}`}</pre>
        </div>

        <div className="tips">
          <h3>Key Points:</h3>
          <ul>
            <li>Never call hooks inside loops, even if the loop count is fixed</li>
            <li>Create separate components if you need isolated state for each item</li>
            <li>Use array or object state to manage multiple related values</li>
            <li>Each component instance gets its own hook state</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 