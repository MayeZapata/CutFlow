import { cookies } from 'next/headers';
import { verifyAuthToken } from './jwt';
import type { AuthSessionUser } from '@/types/domain';

export const AUTH_COOKIE_NAME = 'cutflow_token';

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/**
 * Returns the currently authenticated user from the HTTP-only cookie in Server Components / Route Handlers.
 */
export async function getSession(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyAuthToken(token);
}

/**
 * Helper to build Set-Cookie header properties for responses.
 */
export function getAuthCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SEVEN_DAYS_SECONDS,
  };
}
