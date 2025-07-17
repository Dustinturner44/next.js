'use client'

import Link from 'next/link'
// Intentionally missing imports to cause errors

export default function MissingImportPage() {
  // These will cause immediate errors due to missing imports
  // @ts-ignore - intentional missing import
  const [count, setCount] = useState(0)
  
  // @ts-ignore - intentional missing import  
  useEffect(() => {
    console.log('Component mounted')
  }, [])
  
  // @ts-ignore - intentional missing import
  const router = useRouter()
  
  // @ts-ignore - intentional missing import
  const classes = clsx('container', 'error-page')

  return (
    <div className={classes}>
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Missing Import Errors</h1>
        <p>This page immediately uses undefined imports and variables</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>🔴 Active Import Errors</h2>
          <ul>
            <li>useState hook used without import from 'react'</li>
            <li>useEffect hook used without import from 'react'</li>
            <li>useRouter hook used without import from 'next/router'</li>
            <li>clsx utility used without import from 'clsx'</li>
          </ul>
        </div>

        <div className="error-showcase">
          <h3>Missing Import Examples</h3>
          
          <div className="error-item">
            <h4>React Hook Usage:</h4>
            <div className="error-content">
              Count: {count}
              <button onClick={() => setCount(count + 1)}>
                Increment
              </button>
            </div>
          </div>

          <div className="error-item">
            <h4>Next.js Router Usage:</h4>
            <div className="error-content">
              Current path: {typeof router !== 'undefined' ? router.pathname : 'undefined'}
            </div>
          </div>

          <div className="error-item">
            <h4>Utility Library Usage:</h4>
            <div className="error-content">
              Classes: {classes}
            </div>
          </div>

          <div className="error-item">
            <h4>Component Usage:</h4>
            <div className="error-content">
              {/* @ts-ignore - intentional missing import */}
              <Image src="/test.jpg" alt="Test" width={100} height={100} />
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Currently Active):</h3>
          <pre>{`// ❌ Missing imports causing immediate errors:

// ReferenceError: useState is not defined
const [count, setCount] = useState(0)

// ReferenceError: useEffect is not defined
useEffect(() => {
  console.log('Component mounted')
}, [])

// ReferenceError: useRouter is not defined
const router = useRouter()

// ReferenceError: clsx is not defined
const classes = clsx('container', 'error-page')

// ReferenceError: Image is not defined
<Image src="/test.jpg" alt="Test" width={100} height={100} />

// ✅ Correct imports:

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import clsx from 'clsx'

// Then use them normally:
const [count, setCount] = useState(0)
useEffect(() => { ... }, [])
const router = useRouter()
const classes = clsx('container', 'error-page')`}</pre>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .header {
          margin-bottom: 2rem;
        }

        .back-link {
          color: #0070f3;
          text-decoration: none;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0.5rem 0;
          color: #1a1a1a;
        }

        .header p {
          color: #666;
          margin: 0;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .explanation {
          background: #fee2e2;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid #dc2626;
        }

        .explanation h2 {
          margin: 0 0 1rem 0;
          color: #dc2626;
        }

        .explanation ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .explanation li {
          margin-bottom: 0.5rem;
          color: #7f1d1d;
        }

        .error-showcase {
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fef2f2;
        }

        .error-showcase h3 {
          margin: 0 0 1.5rem 0;
          color: #dc2626;
        }

        .error-item {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .error-item h4 {
          margin: 0 0 0.5rem 0;
          color: #991b1b;
          font-size: 1rem;
        }

        .error-content {
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          color: #374151;
          word-break: break-all;
        }

        .error-content button {
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .code-example {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 1.5rem;
          color: white;
        }

        .code-example h3 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .code-example pre {
          margin: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
} 