'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
    });

    if (!result.success) {
      setError(result.error || 'No se pudo completar el registro.');
      setLoading(false);
      return;
    }

    // New registered users are clients; redirect to booking experience
    router.push('/');
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl border border-gold/30 bg-surface/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-gold/20">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/30 mb-3">
            <span className="size-1.5 rounded-full bg-gold animate-pulse" />
            Nuevo Cliente
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-cream">
            Crear cuenta
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted">
            Regístrate para reservar citas en segundos con tus barberos preferidos en Colombia.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="name-input"
              className="block text-xs font-medium text-cream mb-1"
            >
              Nombre completo
            </label>
            <input
              id="name-input"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mateo Restrepo"
              disabled={loading}
              className="field w-full text-sm py-2 px-3.5"
            />
          </div>

          <div>
            <label
              htmlFor="email-reg-input"
              className="block text-xs font-medium text-cream mb-1"
            >
              Correo electrónico
            </label>
            <input
              id="email-reg-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              disabled={loading}
              className="field w-full text-sm py-2 px-3.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="phone-reg-input"
                className="block text-xs font-medium text-cream"
              >
                Celular / WhatsApp
              </label>
              <span className="text-[10px] text-muted">Para recordatorios</span>
            </div>
            <input
              id="phone-reg-input"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 300 123 4567"
              disabled={loading}
              className="field w-full text-sm py-2 px-3.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password-reg-input"
                className="block text-xs font-medium text-cream"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-muted hover:text-gold transition"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="password-reg-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              className="field w-full text-sm py-2 px-3.5"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password-input"
              className="block text-xs font-medium text-cream mb-1"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              disabled={loading}
              className="field w-full text-sm py-2 px-3.5"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold justify-center shadow-lg shadow-gold/20"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-night border-t-transparent rounded-full animate-spin" />
                  <span>Creando tu cuenta...</span>
                </span>
              ) : (
                <span>Registrarme en CutFlow</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-line/60 text-center text-xs text-muted">
          <span>¿Ya tienes cuenta? </span>
          <Link
            href="/login"
            className="font-semibold text-gold hover:text-gold-soft transition underline-offset-2 hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
