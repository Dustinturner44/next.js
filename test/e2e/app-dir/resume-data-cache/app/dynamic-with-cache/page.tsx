import { headers } from 'next/headers'
import { Suspense } from 'react'

// Note: With dynamicIO enabled, dynamic is controlled automatically
// Using "use cache" directive instead of unstable_cache for dynamicIO compatibility
async function getCachedTimestamp(testId: string) {
  'use cache'
  return {
    timestamp: Date.now(),
    testId,
    dynamicIO: true,
  }
}

async function DynamicCachedComponent() {
  const headersList = await headers()
  const testId = headersList.get('X-Test-ID') || 'default'

  const data = await getCachedTimestamp(testId)

  return (
    <div data-timestamp={data.timestamp}>
      Dynamic content for ID: {testId}
      <br />
      Generated at: {new Date(data.timestamp).toISOString()}
    </div>
  )
}

export default function DynamicWithCachePage() {
  return (
    <div>
      <h1>Dynamic Page with Cache</h1>
      <Suspense fallback={<div>Loading dynamic content...</div>}>
        <DynamicCachedComponent />
      </Suspense>
    </div>
  )
}
