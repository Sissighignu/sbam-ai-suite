import { NextResponse } from 'next/server'

export function middleware(request) {
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const auth = basicAuth.split(' ')[1]
    const [user, pwd] = atob(auth).split(':')
    if (
      user === process.env.INTERNAL_USER &&
      pwd === process.env.INTERNAL_PASSWORD
    ) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Accesso riservato — SBAM Internal Tool', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="SBAM.ai – Accesso riservato"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
