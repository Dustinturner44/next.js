import { Suspense } from 'react'
import { cachedDelay, uncachedIO } from '../../shared'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <h1 style={{ color: 'orange' }}>Page one</h1>

      <ul>
        <li>
          <Link href={`/shared-layout/one/nested`}>./nested</Link>
        </li>
        <li>
          <Link href={`/shared-layout/one/nested-runtime`}>
            ./nested-runtime
          </Link>
        </li>
      </ul>

      <Suspense fallback={<div style={{ color: 'grey' }}>Loading 1...</div>}>
        <RuntimePrefetchable />
      </Suspense>
    </main>
  )
}

async function RuntimePrefetchable() {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('testCookie')?.value ?? null
  await cachedDelay([__filename, cookieValue])
  return (
    <div style={{ border: '1px solid blue', padding: '1em' }}>
      <div id="cookie-value-page">{`Cookie from page: ${cookieValue}`}</div>
      <Suspense fallback={<div style={{ color: 'grey' }}>Loading 2...</div>}>
        <Dynamic />
      </Suspense>
    </div>
  )
}

async function Dynamic() {
  await uncachedIO()
  return (
    <div style={{ border: '1px solid tomato', padding: '1em' }}>
      <div id="dynamic-content-page">Dynamic content from page one</div>
    </div>
  )
}
