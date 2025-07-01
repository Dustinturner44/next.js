import { NextResponse } from 'next/server'

export const config = {
  matcher: '/robots.txt',
}

export function middleware(request: Request) {
  return NextResponse.rewrite(new URL('/redirected-robots', request.url))
}
