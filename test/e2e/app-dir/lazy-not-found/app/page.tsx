import Link from 'next/link'
import React from 'react'

export default function Page() {
  return (
    <div>
      Home Page
      <Link href="/about">Go to about</Link>
    </div>
  )
}
