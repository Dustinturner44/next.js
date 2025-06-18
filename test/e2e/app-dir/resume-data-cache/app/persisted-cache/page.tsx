import { unstable_cacheLife } from 'next/cache'

// Using "use cache" directive with unstable_cacheLife to test cache persistence
// Setting revalidate to Infinity ensures the cache never expires and persists across server restarts
async function getPersistedData() {
  'use cache'
  unstable_cacheLife({ revalidate: Infinity })

  return {
    message: 'Cache loaded from disk',
    timestamp: Date.now(),
    processId: process.pid,
  }
}

export default async function PersistedCachePage() {
  const data = await getPersistedData()

  return (
    <div>
      <h1>Persisted Cache Test</h1>
      <p>{data.message}</p>
      <p>Process ID: {data.processId}</p>
      <p>Timestamp: {new Date(data.timestamp).toISOString()}</p>
    </div>
  )
}
