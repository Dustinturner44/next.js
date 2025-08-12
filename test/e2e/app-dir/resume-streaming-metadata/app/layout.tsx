import { ReactNode, Suspense } from 'react'
export default function Root({
  children,
  sidebar,
  content,
}: {
  children: ReactNode
  sidebar: ReactNode
  content: ReactNode
}) {
  return (
    <html>
      <body>
        <Suspense>
          {sidebar}
          {children}
          {content}
        </Suspense>
      </body>
    </html>
  )
}
