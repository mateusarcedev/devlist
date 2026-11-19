import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const intended = request.nextUrl.searchParams.get('next') || '/'
  // Only allow local relative paths as OAuth return destinations.
  const next = intended.startsWith('/') && !intended.startsWith('//') && !intended.includes('\\')
    ? intended
    : '/'
  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(new URL(next, request.url))
    } catch {
      // Missing environment or provider misconfiguration falls through to the login error page.
    }
  }
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
