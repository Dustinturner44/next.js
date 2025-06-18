import { unstable_cache } from 'next/cache'

const getLargeData = unstable_cache(
  async () => {
    // Generate large data payload
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `Item ${i} with some additional text to make it larger`,
      nested: {
        field1: `Field 1 for item ${i}`,
        field2: `Field 2 for item ${i}`,
        field3: `Field 3 for item ${i}`,
      },
    }))

    return {
      items: largeArray,
      timestamp: Date.now(),
      metadata: {
        count: largeArray.length,
        generated: new Date().toISOString(),
      },
    }
  },
  ['large-data'],
  {
    revalidate: 3600,
  }
)

export default async function LargeCacheTestPage() {
  const data = await getLargeData()

  return (
    <div>
      <h1>Large Cache Test</h1>
      <p>Large data processed</p>
      <p>Items count: {data.items.length}</p>
      <p>Generated at: {data.metadata.generated}</p>
      <details>
        <summary>First 5 items</summary>
        <pre>{JSON.stringify(data.items.slice(0, 5), null, 2)}</pre>
      </details>
    </div>
  )
}
