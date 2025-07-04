// its a client component, so its always static....
// so when you refetch the not found tree, it doesn't run
// any actual compute..
// TODO: so maybe we should fetch from a different endpoint??
'use client'

import { notFound } from 'next/navigation'
import { useState } from 'react'

export default function AboutPage() {
  // notFound()
  const [error, setError] = useState(false)

  if (error) {
    notFound()
  }

  return (
    <div>
      About Page
      <button onClick={() => setError(true)}>Not Found</button>
    </div>
  )
}
