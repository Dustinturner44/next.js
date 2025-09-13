import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { Suspense } from 'react'

export const unstable_prefetch = 'unstable_runtime'

export default function Page() {
  return (
    <main>
      <h1>Nested page (runtime prefetch)</h1>
      {/* <Runtime /> */}
      <Suspense fallback="Loading runtime...">
        <Runtime />
      </Suspense>
      {/* <Dynamic /> */}
      <Suspense fallback="Loading dynamic...">
        <Dynamic />
      </Suspense>
      {/* <Suspense fallback="Loading...">
        <DynamicTimeout />
      </Suspense> */}
    </main>
  )
}

async function Runtime() {
  await cookies()
  return <div>Runtime content</div>
}

async function Dynamic() {
  await connection()
  return <div>Dynamic content</div>
}

async function DynamicTimeout() {
  await new Promise((resolve) => setTimeout(resolve))
  return <div>Dynamic content (after a timeout)</div>
}
