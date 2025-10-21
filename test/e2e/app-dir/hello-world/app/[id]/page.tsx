import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { unstable_noStore } from 'next/cache'
import { connection } from 'next/server'

// export const unstable_prefetch = {
//   mode: 'runtime',
//   samples: [{}],
// }

// export async function generateViewport() {
//   // cookies().then(() => console.log('~~~ cookies resolved ~~~'))
//   await cookies()
//   // await connection()
//   return {}
// }

export default function Page({ params }) {
  unstable_noStore()
  return (
    <main>
      <div>this is static</div>
      {/* <Sync /> */}
      {/* <SyncAfterCookies />
      <Dynamic /> */}
      {/* <Runtime /> */}
      {/* <Suspense fallback="loading...">
        <Dynamic />
      </Suspense> */}
      <Suspense fallback="loading...">{/* <Runtime /> */}</Suspense>
      {/* <Cached />
      <Suspense fallback="loading...">
        <Params params={params} />
      </Suspense> */}
    </main>
  )
}

async function SyncAfterCookies() {
  await cookies()
  Math.random()
  await fetch('https://example.com')
  return <p>hello sync after cookies</p>
}

async function Sync() {
  Math.random()
  await fetch('https://example.com')
  return <p>hello sync after cookies</p>
}

async function Dynamic() {
  await fetch('https://example.com')
  return <p>hello dynamic</p>
}

async function Runtime() {
  await cookies()
  return <p>hello runtime</p>
}

async function Params({ params }) {
  await params
  return <p>hello params {JSON.stringify(await params)}</p>
}

async function Cached() {
  'use cache'
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return <p>hello cached</p>
}
