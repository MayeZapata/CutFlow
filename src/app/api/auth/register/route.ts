import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { UserModel } from '@/lib/db/models';
import { hashPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/session';
import type { AuthSessionUser } from '@/types/domain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 });
    }

    const { name, email, password, phone } = body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Ingresa un nombre válido (mínimo 2 caracteres)' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Ingresa un correo electrónico válido' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo electrónico' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = `user-${crypto.randomUUID()}`;

    const newUser = await UserModel.create({
      _id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone && typeof phone === 'string' ? phone.trim() : undefined,
      role: 'client', // Registration defaults to client role as requested
    });

    const sessionUser: AuthSessionUser = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: 'client',
    };

    const token = await signAuthToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: '¡Registro exitoso! Bienvenido a CutFlow.',
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOpts);

    return response;
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor al registrar el usuario' },
      { status: 500 }
    );
  }
}
