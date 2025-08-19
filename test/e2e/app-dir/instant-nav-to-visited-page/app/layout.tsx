import Link from 'next/link'
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <Link href={`/lesson-1`}>Introduction to LLMs</Link>
        </div>
        <div>
          <Link href={`/lesson-2`}>Prompting Fundamentals</Link>
        </div>
        <div>
          <Link href={`/lesson-3`}>AI SDK Dev Setup</Link>
        </div>
        <div>
          <Link href={`/lesson-4`}>Data Extraction</Link>
        </div>
        <div>
          <main>
            <Suspense>{children}</Suspense>
            <ul>
              <li>Make sure everything is prefetched</li>
              <li>Click each link once</li>
              <li>Turn on 3G</li>
              <li>Clicking around these links is still not instant</li>
            </ul>
          </main>
        </div>
      </body>
    </html>
  )
}
