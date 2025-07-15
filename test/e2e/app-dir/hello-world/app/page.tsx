'use client'
export default function Page() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        <p style={{ color: '#d4d4d8', fontSize: '0.9rem' }}>hello world</p>
      </div>
    </div>
  )
}
