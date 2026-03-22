import { NextResponse } from 'next/server'

export async function POST(request) {
  const { username, password } = await request.json()

  const validUser = process.env.INTERNAL_USER
  const validPassword = process.env.INTERNAL_PASSWORD
  const sessionToken = process.env.SESSION_TOKEN

  if (username === validUser && password === validPassword) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('sbam_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: '/',
    })
    return response
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
