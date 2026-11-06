import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { UserModel } from '@/lib/db/models';
import { verifyPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/session';
import type { AuthSessionUser } from '@/types/domain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Por favor ingresa tu correo electrónico' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Por favor ingresa tu contraseña' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    const sessionUser: AuthSessionUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const token = await signAuthToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: `¡Bienvenido de nuevo, ${user.name}!`,
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOpts);

    return response;
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor al iniciar sesión' },
      { status: 500 }
    );
  }
}
