// @ts-ignore - Intentional error for testing auto-fix
import React from 'react'

// ERROR: Client components cannot be async in React
export default async function AsyncComponentPage() {
  // This will cause a hydration error and runtime issues
  const data = await fetch('https://api.example.com/data')
  const result = await data.json()
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Async Component Error</h1>
      <p>This page demonstrates incorrect async component usage.</p>
      <ul>
        <li>Client component marked as async</li>
        <li>Await calls in component body</li>
        <li>Will cause hydration mismatch</li>
      </ul>
      <div>
        <h3>Fetched Data:</h3>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}

// ERROR: Async functional component (another common mistake)
const AsyncSubComponent = async () => {
  // @ts-ignore
  const response = await fetch('/api/data')
  return <div>Async sub-component</div>
}

// ERROR: Using async in useEffect incorrectly
function ComponentWithBadAsync() {
  // @ts-ignore
  React.useEffect(async () => {
    // This is wrong - useEffect callback shouldn't be async
    const data = await fetch('/api/data')
    console.log(data)
  }, [])
  
  return <div>Component with bad async usage</div>
} 