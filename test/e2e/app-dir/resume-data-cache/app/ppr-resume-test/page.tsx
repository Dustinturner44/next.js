import { Suspense } from 'react'
import { headers } from 'next/headers'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Using "use cache" directive instead of unstable_cache for dynamicIO compatibility
async function getCachedData(cacheKey: string, testInput: string) {
  'use cache'
  return {
    timestamp: Date.now(),
    cacheKey,
    testInput,
    data: `Cached data for ${cacheKey}`,
    dynamicIO: true,
  }
}

async function ResumeTestContent() {
  // With dynamicIO, headers() returns a promise that can be awaited
  const headersList = await headers()
  const cacheKey = headersList.get('X-Cache-Key') || 'default'
  const testInput = headersList.get('X-Test-Input') || 'default-value'
  const delay = parseInt(headersList.get('X-Delay') || '0', 10)

  if (delay > 0) {
    await sleep(delay)
  }

  const startTime = Date.now()
  const data = await getCachedData(cacheKey, testInput)
  const fetchTime = Date.now() - startTime

  // With "use cache", cache hits are typically much faster (<10ms)
  const cacheHit = fetchTime < 10

  return (
    <div data-resumed="true" data-cache-hit={cacheHit} data-dynamic-io="true">
      <h2>Resume Test Content (DynamicIO)</h2>
      <p>Cache Key: {cacheKey}</p>
      <p>Data: {data.data}</p>
      <p>Test Input: {testInput}</p>
      <p>Timestamp: {data.timestamp}</p>
      <p>Cache Hit: {cacheHit ? 'YES' : 'NO'}</p>
      <p>DynamicIO Enabled: {data.dynamicIO ? 'YES' : 'NO'}</p>
      <p>Fetch Time: {fetchTime}ms</p>
    </div>
  )
}

export default function PPRResumeTestPage() {
  return (
    <div>
      <h1>PPR Resume Test (DynamicIO)</h1>
      <p>
        This page demonstrates PPR with dynamicIO enabled for enhanced caching.
      </p>
      <Suspense fallback={<div>Loading dynamic content...</div>}>
        <ResumeTestContent />
      </Suspense>
    </div>
  )
}
