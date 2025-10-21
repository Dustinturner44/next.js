export function proxy(req) {
  if (req.nextUrl.pathname === '/middleware-error') {
    throw new Error('middleware-error')
  }
}
