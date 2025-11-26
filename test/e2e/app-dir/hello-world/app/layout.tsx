'use client'

import useSWR, { type Middleware } from "swr"
import { redirectAction } from "./actions"

const logger: Middleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    const extendedFetcher = (...args: any[]) => {
      queueMicrotask(async () => {
        await redirectAction()
      })
      return fetcher(...args)
    }
    return useSWRNext(key, extendedFetcher, config)
  }
}

export default function Root({ children }: { children: React.ReactNode }) {
  useSWR('key', () => 'value', { use: [logger] })

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
