'use client'

import Link from 'next/link'
import '../shared.css'

export default function InvalidHooksPage() {
  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Invalid Hook Usage Errors</h1>
        <p>Navigate to specific hook violation examples</p>
      </header>

              <div className="content main-page">
        <div className="explanation">
          <h2>Rules of Hooks</h2>
          <ul>
            <li><strong>Only call hooks at the top level:</strong> Don't call hooks inside loops, conditions, or nested functions</li>
            <li><strong>Only call hooks from React functions:</strong> Call hooks from React function components or custom hooks</li>
            <li><strong>Hooks must be called in the same order every time:</strong> This ensures React can correctly preserve hook state</li>
            <li><strong>Don't call hooks after early returns:</strong> Hooks must be called before any possible return statement</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Hook Violation Examples</h3>
          <p className="demo-description">
            Each example demonstrates a specific violation of React's Rules of Hooks.
            These errors will trigger automatically when you visit each page.
          </p>
          
          <div className="hook-links">
            <Link href="/invalid-hooks/conditional" className="hook-link conditional">
              <div className="link-content">
                <h4>Conditional Hook</h4>
                <p>Hook called inside an if statement</p>
                <span className="arrow">→</span>
              </div>
            </Link>
            
            <Link href="/invalid-hooks/loop" className="hook-link loop">
              <div className="link-content">
                <h4>Hook in Loop</h4>
                <p>Hook called inside a for loop</p>
                <span className="arrow">→</span>
              </div>
            </Link>
            
            <Link href="/invalid-hooks/nested" className="hook-link nested">
              <div className="link-content">
                <h4>Nested Hook</h4>
                <p>Hook called in nested function</p>
                <span className="arrow">→</span>
              </div>
            </Link>
            
            <Link href="/invalid-hooks/after-return" className="hook-link after-return">
              <div className="link-content">
                <h4>Hook After Return</h4>
                <p>Hook called after early return</p>
                <span className="arrow">→</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="code-example">
          <h3>Common Fixes for Hook Violations:</h3>
          <pre>{`// ❌ Don't call hooks conditionally
function BadComponent({ condition }) {
  if (condition) {
    const [state, setState] = useState(0) // Error!
  }
  return <div>Hello</div>
}

// ✅ Always call hooks at top level
function GoodComponent({ condition }) {
  const [state, setState] = useState(0)
  
  if (condition) {
    setState(prev => prev + 1)
  }
  
  return <div>Hello</div>
}

// ❌ Don't call hooks in loops
function BadList({ items }) {
  return items.map((item, index) => {
    const [selected, setSelected] = useState(false) // Error!
    return <div key={index}>{item}</div>
  })
}

// ✅ Create separate components
function ListItem({ item }) {
  const [selected, setSelected] = useState(false)
  return <div>{item}</div>
}

function GoodList({ items }) {
  return items.map((item, index) => (
    <ListItem key={index} item={item} />
  ))
}`}</pre>
        </div>
      </div>
    </div>
  )
} 