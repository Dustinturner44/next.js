import { Suspense } from 'react'
import { connection } from 'next/server'

async function getCachedData() {
  // With dynamicIO, we need to await connection() before using Date.now()
  await connection()
  const timestamp = Date.now()

  // This simulates a data fetch that would be cached
  try {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts/1',
      {
        next: { revalidate: 3600 },
      }
    )
    const data = await response.json()

    return {
      timestamp,
      data: data.title || 'Sample cached data',
    }
  } catch (e) {
    return {
      timestamp,
      data: 'Sample cached data',
    }
  }
}

async function CachedComponent() {
  const data = await getCachedData()

  return (
    <div id="cached-fetch">
      Cached at: {new Date(data.timestamp).toISOString()}
    </div>
  )
}

export default function StaticWithCachePage() {
  return (
    <div>
      <div id="static-content">Static Content</div>
      <Suspense fallback={<div>Loading...</div>}>
        <CachedComponent />
      </Suspense>
    </div>
  )
}
