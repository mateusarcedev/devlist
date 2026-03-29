import { jwtVerify } from 'jose'
import { type NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value

  const headers = new Headers(req.headers)
  headers.set('x-current-path', req.nextUrl.pathname)

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next({ headers })
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
