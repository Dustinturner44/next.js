import Link from 'next/link'

export default async function Home() {
  return (
    <div>
      <div>
        <Link href="/foo">Go to /foo</Link>
      </div>
    </div>
  )
}
