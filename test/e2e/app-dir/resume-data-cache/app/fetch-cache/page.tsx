import { unstable_cache } from 'next/cache'

const getCachedPost = unstable_cache(
  async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
    const data = await response.json()
    return {
      ...data,
      cachedAt: Date.now(),
    }
  },
  ['fetch-cache-post'],
  {
    revalidate: 3600,
  }
)

async function FetchWithCache() {
  // First call to populate cache
  const firstCall = await getCachedPost()

  // Second call should hit cache
  const secondCall = await getCachedPost()

  // If timestamps are the same, it's a cache hit
  const cacheHit = firstCall.cachedAt === secondCall.cachedAt

  return (
    <div>
      <div>API Response: {secondCall.title}</div>
      <div id="cache-status" data-cache-status={cacheHit ? 'HIT' : 'MISS'}>
        Cache Status: {cacheHit ? 'HIT' : 'MISS'}
      </div>
    </div>
  )
}

export default function FetchCachePage() {
  return (
    <div>
      <h1>Fetch Cache Test</h1>
      <FetchWithCache />
    </div>
  )
}
