'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'Cliente',
    email: 'cliente@cutflow.com',
    pass: 'cliente123',
  },
  {
    role: 'Admin',
    email: 'admin@cutflow.com',
    pass: 'admin123',
  },
  {
    role: 'Superadmin',
    email: 'superadmin@cutflow.com',
    pass: 'super123',
  },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password);

    if (!result.success) {
      setError(result.error || 'Credenciales inválidas.');
      setLoading(false);
      return;
    }

    // Role-based redirect (respects returnTo for clients)
    const userRole = result.user?.role;
    if (userRole === 'superadmin') {
      router.push('/superadmin');
    } else if (userRole === 'admin') {
      router.push('/admin');
    } else {
      router.push(returnTo || '/');
    }
  }

  function handleFillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl border border-gold/30 bg-surface/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-gold/20">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/30 mb-3">
            <span className="size-1.5 rounded-full bg-gold animate-pulse" />
            Acceso a CutFlow
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-cream">
            Iniciar sesión
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted">
            Ingresa con tu correo y contraseña para gestionar tus citas.
          </p>
        </div>

        {/* Demo Fast Fill Section: Pequeñas chips / badges sin emojis */}
        <div className="mb-5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-line/70 bg-surface-2/50 px-3.5 py-2 text-xs">
          <span className="text-[11px] font-medium text-muted mr-1">Demo rápido:</span>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleFillDemo(acc.email, acc.pass)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition active:scale-95 ${
                email === acc.email
                  ? 'border-gold bg-gold/20 text-gold shadow-xs'
                  : 'border-line/80 bg-surface/80 text-cream/80 hover:border-gold/50 hover:bg-gold/10 hover:text-gold'
              }`}
              title={`Autocompletar como ${acc.role}`}
            >
              {acc.role}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-danger underline hover:text-danger/80 ml-2"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email-input"
              className="block text-xs font-medium text-cream mb-1.5"
            >
              Correo electrónico
            </label>
            <input
              id="email-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              disabled={loading}
              className="field w-full text-sm py-2.5 px-3.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password-input"
                className="block text-xs font-medium text-cream"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-muted hover:text-gold transition"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="field w-full text-sm py-2.5 px-3.5 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream text-xs"
                tabIndex={-1}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-semibold justify-center shadow-lg shadow-gold/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 border-2 border-night border-t-transparent rounded-full animate-spin" />
                <span>Iniciando sesión...</span>
              </span>
            ) : (
              <span>Entrar a CutFlow</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-line/60 text-center text-xs text-muted">
          <span>¿Aún no tienes cuenta? </span>
          <Link
            href="/register"
            className="font-semibold text-gold hover:text-gold-soft transition underline-offset-2 hover:underline"
          >
            Regístrate aquí gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
