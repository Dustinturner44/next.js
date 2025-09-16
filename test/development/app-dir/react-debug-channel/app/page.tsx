import Link from 'next/link'

export default function Page() {
  // console.error(new Error('test'))
  return (
    <div key="foo">
      <p>home page</p>
      <p>
        <Link href="/other">Go to other page</Link>
      </p>
    </div>
  )
}
