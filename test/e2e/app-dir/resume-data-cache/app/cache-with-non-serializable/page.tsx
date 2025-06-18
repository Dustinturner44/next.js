import { Suspense } from 'react'
import { connection } from 'next/server'

async function NonSerializableComponent() {
  // With dynamicIO, we need to await connection() before using Date.now()
  await connection()

  // Attempt to cache something that might fail serialization
  const data = {
    text: 'This is serializable',
    // In a real scenario, this might be a circular reference or function
    timestamp: Date.now(),
  }

  return (
    <div>
      <p>Data: {data.text}</p>
      <p>Timestamp: {data.timestamp}</p>
    </div>
  )
}

export default function CacheWithNonSerializablePage() {
  return (
    <div>
      <h1>Cache with Non-Serializable Data</h1>
      <p>Rendered successfully</p>
      <Suspense fallback={<div>Loading...</div>}>
        <NonSerializableComponent />
      </Suspense>
    </div>
  )
}
