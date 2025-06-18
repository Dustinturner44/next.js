import { unstable_cache } from 'next/cache'

// Using unstable_cache here to test cache persistence with revalidate: false
// which ensures the cache never expires and persists across server restarts
const getPersistedData = unstable_cache(
  async () => {
    return {
      message: 'Cache loaded from disk',
      timestamp: Date.now(),
      processId: process.pid,
    }
  },
  ['persisted-data'],
  {
    revalidate: false, // Never revalidate, always use cache
  }
)

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
