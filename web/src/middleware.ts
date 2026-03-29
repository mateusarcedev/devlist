import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const headers = new Headers(req.headers)
    headers.set('x-current-path', req.nextUrl.pathname)

    const role = req.nextauth.token?.role

    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!role || role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next({ headers })
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ['/admin/:path*'],
}
