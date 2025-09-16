import Link from 'next/link'

export default function Page() {
  return (
    <div>
      <p>other page</p>
      <p>
        <Link href="/">Go to home page</Link>
      </p>
    </div>
  )
}
