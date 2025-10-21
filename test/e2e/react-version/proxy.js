import { NextResponse } from 'next/server'
import { getReactConditionJson } from './lib/react-version'

export function proxy(request) {
  if (request.nextUrl.pathname === '/middleware') {
    return Response.json(getReactConditionJson())
  }

  return NextResponse.next()
}
