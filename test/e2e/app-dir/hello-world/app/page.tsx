import { cookies } from 'next/headers'
// import { Suspense } from 'react'
import { unstable_noStore } from 'next/cache'

export default function Page() {
  unstable_noStore()
  return (
    <main>
      <div>this is static</div>
      <Dynamic />
      <Runtime />
      {/* <Suspense fallback="loading...">
        <Dynamic />
      </Suspense>
      <Suspense fallback="loading...">
        <Runtime />
      </Suspense> */}
      <Cached />
    </main>
  )
}

async function Dynamic() {
  await fetch('https://example.com')
  console.log('(( after fetch ))')
  return <p>hello dynamic</p>
}

async function Runtime() {
  await cookies()
  console.log('(( after cookies() ))')
  return <p>hello runtime</p>
}

async function Cached() {
  'use cache'
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return <p>hello cached</p>
}
