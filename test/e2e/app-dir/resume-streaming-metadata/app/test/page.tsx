import { Suspense } from 'react'
import { headers } from 'next/headers'

// Force multiple components before metadata
function Component1() {
  return <div>Component 1</div>
}

function Component2() {
  return <div>Component 2</div>
}

async function AsyncComponent() {
  // This component loads async data that might affect position
  await new Promise((resolve) => setTimeout(resolve, 50))
  return <div>Async Component</div>
}

export async function generateMetadata() {
  // Async metadata that takes time
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Try to access headers which might affect timing
  const headersList = await headers()
  const testHeader = headersList.get('x-test') || 'default'

  return {
    title: `Test Page - ${testHeader}`,
    description: 'Testing metadata boundary position',
  }
}

export default function TestPage() {
  return (
    <>
      <Component1 />
      <Component2 />
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
      <div>Main content at index 3</div>
    </>
  )
}
