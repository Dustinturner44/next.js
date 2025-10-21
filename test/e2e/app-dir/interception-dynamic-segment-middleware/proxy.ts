import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const locale = 'en'
  const { pathname } = request.nextUrl
  const pathnameHasLocale =
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  if (pathnameHasLocale) return

  request.nextUrl.pathname = `/en${pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
