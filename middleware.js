import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Lascia passare sempre la pagina di login e la sua API
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  // Controlla il cookie di sessione
  const session = request.cookies.get('sbam_session')
  if (session?.value === process.env.SESSION_TOKEN) {
    return NextResponse.next()
  }

  // Reindirizza al login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
