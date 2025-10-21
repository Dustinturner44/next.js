import { NextResponse } from 'next/server'

export const config = { matcher: ['/foo'] }
export async function proxy(req) {
  return NextResponse.next()
}
