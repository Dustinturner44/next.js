import { unstable_cacheTag, unstable_cacheLife } from 'next/cache'

// Using "use cache" directive with unstable_cacheTag and unstable_cacheLife
// to test cache tags and revalidation options
async function getTaggedData() {
  'use cache'
  unstable_cacheTag('test-tag')
  unstable_cacheLife({ revalidate: 3600 })

  const timestamp = Date.now()
  return {
    data: 'This is tagged data',
    timestamp,
  }
}

export default async function CacheTagsPage() {
  const data = await getTaggedData()

  return (
    <div>
      <h1>Cache Tags Test</h1>
      <div>Tagged Data: {data.data}</div>
      <div data-time={data.timestamp}>
        Generated at: {new Date(data.timestamp).toISOString()}
      </div>
    </div>
  )
}
