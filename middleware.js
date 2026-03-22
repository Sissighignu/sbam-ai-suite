import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/login']

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Lascia passare percorsi pubblici
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) return NextResponse.next()

  // Controlla cookie
  const session = request.cookies.get('sbam_session')
  if (session?.value === 'authenticated') return NextResponse.next()

  // Redirect al login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
