import { hasValidAccessToken } from '@/lib/proxy-auth'
import { type NextRequest, NextResponse } from 'next/server'

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value

  const headers = new Headers(req.headers)
  headers.set('x-current-path', req.nextUrl.pathname)

  const authenticated = await hasValidAccessToken(
    token,
    process.env.JWT_SECRET,
  )

  if (!authenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Do not authorize ADMIN from JWT claims here.
  // The page reads the current user through /auth/me and the API AdminGuard
  // checks the current database role for every mutation.
  return NextResponse.next({ headers })
}

export const config = {
  matcher: ['/admin/:path*'],
}
