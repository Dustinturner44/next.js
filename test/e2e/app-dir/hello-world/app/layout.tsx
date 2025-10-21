import Link from 'next/link'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <ul>
          <li>
            <Link href="/abc">ABC</Link>
          </li>
          <li>
            <Link href="/">Home</Link>
          </li>
        </ul>
      </body>
    </html>
  )
}
