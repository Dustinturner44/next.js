import { NextResponse } from 'next/server'

export function proxy(request: Request) {
  return NextResponse.rewrite(new URL('/render/next', request.url))
}
