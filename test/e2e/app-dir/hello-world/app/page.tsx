"use client"
export default function Page() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Hello World
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#a1a1aa',
          marginBottom: '3rem'
        }}>
          Next.js application
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>React 18</h3>
            <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>Server components and streaming</p>
          </div>
          
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <h3 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>TypeScript</h3>
            <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>Type-safe development</p>
          </div>
        </div>
        
        <button style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          Start Building
        </button>
      </div>
    </div>
  )
}
