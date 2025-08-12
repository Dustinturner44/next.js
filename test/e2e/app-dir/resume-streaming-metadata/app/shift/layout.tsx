import { Suspense } from 'react'

export default function Layout({
  children,
  slot1,
  slot2,
  slot3,
}: {
  children: React.ReactNode
  slot1: React.ReactNode
  slot2: React.ReactNode
  slot3: React.ReactNode
}) {
  // The order of these slots might differ between prerender and resume
  return (
    <div>
      <Suspense fallback={<div>Loading slot1...</div>}>{slot1}</Suspense>
      <Suspense fallback={<div>Loading slot2...</div>}>{slot2}</Suspense>
      {/* Children at index 2 - this is where metadata might interfere */}
      <Suspense>{children}</Suspense>
      <Suspense fallback={<div>Loading slot3...</div>}>{slot3}</Suspense>
    </div>
  )
}
