import { headers } from 'next/headers'
import { unstable_cacheLife } from 'next/cache'
import { Suspense } from 'react'

// Using "use cache" directive with unstable_cacheLife to test concurrent access
// with cache keys and revalidation options, which are important for production scenarios
async function getConcurrentData(requestId: string) {
  'use cache'
  unstable_cacheLife({ revalidate: 3600 })

  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 100))

  return {
    requestId,
    timestamp: Date.now(),
    data: `Data for request ${requestId}`,
  }
}

async function ConcurrentCacheContent() {
  const headersList = await headers()
  const requestId = headersList.get('X-Request-ID') || 'unknown'

  const data = await getConcurrentData(requestId)

  return (
    <div>
      <div data-request-id={requestId}>Request ID: {requestId}</div>
      <p>Data: {data.data}</p>
      <p>Timestamp: {data.timestamp}</p>
    </div>
  )
}

export default function ConcurrentCacheTestPage() {
  return (
    <div>
      <h1>Concurrent Cache Test</h1>
      <Suspense fallback={<div>Loading concurrent cache data...</div>}>
        <ConcurrentCacheContent />
      </Suspense>
    </div>
  )
}
