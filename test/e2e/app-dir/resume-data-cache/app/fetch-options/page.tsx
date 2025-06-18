import { Suspense } from 'react'

async function FetchOptionsContent({
  searchParams,
}: {
  searchParams: Promise<{ cache?: string }>
}) {
  const params = await searchParams
  const cacheOption = (params.cache as RequestCache) || 'default'

  const timestamp = Date.now()

  // Fetch with specified cache option
  await fetch('https://jsonplaceholder.typicode.com/posts/2', {
    cache: cacheOption,
  })

  return (
    <div data-time={timestamp}>
      <h1>Fetch with cache option: {cacheOption}</h1>
      <p>Fetched at: {new Date(timestamp).toISOString()}</p>
    </div>
  )
}

export default function FetchOptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cache?: string }>
}) {
  return (
    <Suspense fallback={<div>Loading fetch options...</div>}>
      <FetchOptionsContent searchParams={searchParams} />
    </Suspense>
  )
}
