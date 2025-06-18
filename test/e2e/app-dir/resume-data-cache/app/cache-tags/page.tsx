import { unstable_cache } from 'next/cache'

const getTaggedData = unstable_cache(
  async () => {
    const timestamp = Date.now()
    return {
      data: 'This is tagged data',
      timestamp,
    }
  },
  ['tagged-data'],
  {
    tags: ['test-tag'],
    revalidate: 3600,
  }
)

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
