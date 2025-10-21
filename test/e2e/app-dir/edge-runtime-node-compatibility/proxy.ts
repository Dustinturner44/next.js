import { NextResponse, NextRequest } from 'next/server'
import { AsyncLocalStorage } from 'async_hooks'

const storage = new AsyncLocalStorage<{}>()

export async function proxy(request: NextRequest) {
  storage.run({}, () => {})

  return NextResponse.next()
}
