import { ReactNode } from 'react'
export default function Root({ children }: { children: ReactNode }) {
  // 512kb of rows with unique content
  const largeShell = Array.from({ length: 512 * 1024 }, (_, i) => {
    return <p key={i}>Row {i}</p>
  })

  return (
    <html>
      <body>
        {children}
        {largeShell}
      </body>
    </html>
  )
}
