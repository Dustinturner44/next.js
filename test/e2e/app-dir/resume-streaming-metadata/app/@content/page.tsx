import { Suspense } from 'react'

async function AsyncComponent() {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return <div>Async content {Math.random()}</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  )
}
