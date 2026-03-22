import { NextResponse } from 'next/server'

export async function POST(request) {
  const { username, password } = await request.json()

  const validUser = process.env.INTERNAL_USER
  const validPassword = process.env.INTERNAL_PASSWORD

  if (username === validUser && password === validPassword) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('sbam_session', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
