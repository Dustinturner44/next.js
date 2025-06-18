import { Suspense } from 'react'
import { headers } from 'next/headers'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function DynamicContent() {
  const headersList = await headers()
  const delay = parseInt(headersList.get('X-Delay') || '1000', 10)
  const testInput = headersList.get('X-Test-Input') || 'default-value'

  await sleep(delay)

  const data = await fetch('https://jsonplaceholder.typicode.com/posts/3', {
    cache: 'force-cache',
  }).then((res) => res.json())

  return (
    <div>
      <h2>Dynamic Content</h2>
      <p>Loaded after {delay}ms delay</p>
      <p>Data: {data.title}</p>
      <p>Test Input: {testInput}</p>
    </div>
  )
}

export default function PPRWithCachePage() {
  return (
    <div>
      <h1>Static Shell</h1>
      <p>This content is served immediately</p>

      <Suspense fallback={<div>Loading dynamic content...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}
