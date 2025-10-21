import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (Math.random() > -1 && request.nextUrl.pathname === '/rewrite') {
    return NextResponse.rewrite(new URL('/rewritten', request.url))
  }
}
