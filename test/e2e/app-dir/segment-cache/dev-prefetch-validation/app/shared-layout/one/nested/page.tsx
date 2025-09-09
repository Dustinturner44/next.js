import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <h1>Nested page</h1>
      <Link href="/shared-layout/one">back to parent</Link>
    </main>
  )
}
