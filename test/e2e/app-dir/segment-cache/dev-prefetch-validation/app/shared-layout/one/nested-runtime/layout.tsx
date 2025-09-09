import { cookies } from 'next/headers'
import { Suspense } from 'react'

export const unstable_prefetch = 'unstable_runtime'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Suspense fallback="Loading...">
        <RuntimePrefetchable />
      </Suspense>
    </>
  )
}

async function RuntimePrefetchable() {
  await cookies()
  return null
}
