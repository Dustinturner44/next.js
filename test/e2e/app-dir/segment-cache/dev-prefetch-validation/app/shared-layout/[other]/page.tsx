import { Suspense } from 'react'
import { uncachedIO } from '../../shared'
import Link from 'next/link'

export default function Page({ params }) {
  return (
    <main>
      <h1 style={{ color: 'orange' }}>Page with param</h1>
      <Suspense fallback={<div style={{ color: 'grey' }}>Loading 1...</div>}>
        <RuntimePrefetchable params={params} />
      </Suspense>
    </main>
  )
}

async function RuntimePrefetchable({ params }) {
  const { other: param } = await params
  return (
    <div style={{ border: '1px solid blue', padding: '1em' }}>
      <div>
        <ul>
          <li>
            <Link href={`/shared-layout/${param}/nested`}>./nested</Link>
          </li>
          <li>
            <Link href={`/shared-layout/${param}/nested-runtime`}>
              ./nested-runtime
            </Link>
          </li>
        </ul>
        <br />
      </div>
      <div id="param-value-page">{`Param: ${param}`}</div>
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
      <div id="dynamic-content-page">Dynamic content from page ...</div>
    </div>
  )
}
