export default function APIRouteErrorPage() {
  const testAPIRoute = async () => {
    try {
      const response = await fetch('/api/route-error', { method: 'GET' })
      console.log('API Response:', response)
    } catch (error) {
      console.error('API Error:', error)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>API Route Error</h1>
      <p>This page demonstrates common API route errors in Next.js App Router.</p>
      
      <h2>Common API Route Mistakes:</h2>
      <ul>
        <li>Using wrong export names (handler instead of GET, POST, etc.)</li>
        <li>Incorrect function signatures</li>
        <li>Not wrapping responses in Response objects</li>
        <li>Using Express.js style (req, res) instead of Next.js style</li>
        <li>Missing async for async operations</li>
        <li>Wrong return formats</li>
      </ul>

      <h2>Test the API:</h2>
      <button 
        onClick={testAPIRoute}
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test API Route (Check Console)
      </button>
      
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        The API route is located at <code>/api/route-error</code> and contains multiple intentional errors.
      </p>
    </div>
  )
} 