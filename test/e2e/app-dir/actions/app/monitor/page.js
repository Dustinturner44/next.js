'use client'

import { useState } from 'react'

import {
  double,
  inc,
  dec,
  redirectAction,
  getHeaders,
  renamed,
  slowInc,
  updateUser,
  calculatePrice,
} from '../client/actions'
import { test } from '../client/actions-lib'

export default function ServerActionsMonitorDemo() {
  const [count, setCount] = useState(0)
  const [lastResult, setLastResult] = useState(null)

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 10px 0'
        }}>
          🚀 Server Actions Monitor Demo
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          margin: '0',
          lineHeight: '1.6'
        }}>
          Interactive demonstration of Next.js Server Actions with real-time monitoring.
          Open the Next.js DevTools to see server action logs in real-time!
        </p>
      </div>

      {/* Counter Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '10px',
          fontWeight: '500'
        }}>
          Current Value
        </div>
        <div
          id="count"
          style={{
            fontSize: '4rem',
            fontWeight: '800',
            color: '#0070f3',
            margin: '0',
            lineHeight: '1'
          }}
        >
          {count}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        <ActionButton
          id="inc"
          onClick={async () => {
            const newCount = await inc(count)
            setCount(newCount)
            // Test renamed action
            // renamed()
          }}
          title="Increment"
          description="Add 1 to counter"
          emoji="➕"
          color="#10b981"
        />

        <ActionButton
          id="slow-inc"
          onClick={async () => {
            const newCount = await slowInc(count)
            setCount(newCount)
          }}
          title="Slow Increment"
          description="Add 1 with 1s delay"
          emoji="🐌"
          color="#f59e0b"
        />

        <ActionButton
          id="dec"
          onClick={async () => {
            const newCount = await dec(count)
            setCount(newCount)
          }}
          title="Decrement"
          description="Subtract 1 from counter"
          emoji="➖"
          color="#ef4444"
        />

        <ActionButton
          id="double"
          onClick={async () => {
            const newCount = await double(count)
            setCount(newCount)
          }}
          title="Double"
          description="Multiply by 2"
          emoji="✖️"
          color="#8b5cf6"
        />
      </div>

      {/* Multi-Argument Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        padding: '25px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          🎯 Multi-Argument Server Actions
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <ActionButton
            id="update-user"
            onClick={async () => {
              const result = await updateUser(123, "John Doe", "john@example.com", 30)
              setLastResult(result)
            }}
            title="Update User"
            description="4 arguments: ID, name, email, age"
            emoji="👤"
            color="#6366f1"
          />

          <ActionButton
            id="calculate-price"
            onClick={async () => {
              const result = await calculatePrice(99.99, 8.5, 10, 5.99)
              setLastResult(result)
            }}
            title="Calculate Price"
            description="4 arguments: base, tax%, discount, shipping"
            emoji="💰"
            color="#ec4899"
          />
        </div>

        {lastResult && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{
              margin: '0 0 10px 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#15803d'
            }}>
              Last Action Result:
            </h4>
            <pre style={{
              margin: '0',
              fontSize: '0.75rem',
              color: '#166534',
              backgroundColor: 'transparent',
              overflow: 'auto'
            }}>
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Advanced Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        padding: '25px'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          🔧 Advanced Server Actions
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <form style={{ display: 'inline-block' }}>
            <button
              id="redirect-pages"
              formAction={() => redirectAction('/pages-dir')}
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#0ea5e9',
                borderColor: '#0ea5e9'
              }}
            >
              🔀 Redirect Action
            </button>
          </form>

          <form action={getHeaders} style={{ display: 'inline-block' }}>
            <button 
              type="submit" 
              id="get-header"
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#06b6d4',
                borderColor: '#06b6d4'
              }}
            >
              📋 Get Headers
            </button>
          </form>

          <form action={test} style={{ display: 'inline-block' }}>
            <button
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#84cc16',
                borderColor: '#84cc16'
              }}
            >
              🧪 Test Action
            </button>
          </form>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e40af'
        }}>
          💡 How to Use
        </h4>
        <ol style={{
          margin: '0',
          paddingLeft: '20px',
          color: '#1e40af',
          lineHeight: '1.6'
        }}>
          <li>Click the Next.js developer indicator (⚪ icon)</li>
          <li>Select "Server Actions" from the menu</li>
          <li>Click any button above to see real-time server action logs</li>
          <li>Try the multi-argument actions to see complex parameter logging</li>
          <li>Watch the logs appear instantly with timestamps and formatted arguments</li>
        </ol>
      </div>


    </div>
  )
}

function ActionButton({ 
  id, 
  onClick, 
  title, 
  description, 
  emoji, 
  color
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        ...buttonBaseStyle,
        backgroundColor: color,
        borderColor: color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '20px 16px',
        minHeight: '120px'
      }}
    >
      <div style={{ fontSize: '2rem' }}>{emoji}</div>
      <div style={{ 
        fontSize: '1rem', 
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '0.875rem', 
        opacity: 0.9,
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        {description}
      </div>
    </button>
  )
}

const buttonBaseStyle = {
  border: '2px solid',
  borderRadius: '8px',
  color: 'white',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  fontFamily: 'inherit'
}
