import { SignJWT, jwtVerify } from 'jose';
import type { AuthSessionUser, UserRole } from '@/types/domain';

const DEFAULT_SECRET = 'cutflow_dev_secret_key_change_in_production_2026';
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET);

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  [key: string]: unknown;
}

export async function signAuthToken(user: AuthSessionUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthSessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    return {
      id: payload.sub,
      name: String(payload.name || ''),
      email: String(payload.email || ''),
      role: (payload.role as UserRole) || 'client',
      phone: payload.phone ? String(payload.phone) : undefined,
    };
  } catch {
    return null;
  }
}
