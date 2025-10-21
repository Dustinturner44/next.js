import { NextResponse } from 'next/server'

export default function proxy(_) {
  const res = NextResponse.next()
  res.headers.set('X-From-Middleware', 'true')
  return res
}

export const config = { matcher: '/random' }
