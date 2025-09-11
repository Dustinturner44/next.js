import React from 'react'
import { ContextProvider } from './context'

export default function Root({
  children,
  slot,
}: {
  children: React.ReactNode
  slot: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ContextProvider>
          <div id="children">{children}</div>
          <div id="slot">{slot}</div>
        </ContextProvider>
      </body>
    </html>
  )
}
