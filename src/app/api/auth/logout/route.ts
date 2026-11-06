import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });

  const cookieOpts = getAuthCookieOptions();
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...cookieOpts,
    maxAge: 0,
  });

  return response;
}
