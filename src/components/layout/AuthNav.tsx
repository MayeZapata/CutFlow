'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  client: { label: 'Cliente', color: 'bg-gold/15 text-gold border-gold/30' },
  admin: { label: 'Admin', color: 'bg-primary/20 text-cream border-line' },
  superadmin: { label: 'Superadmin', color: 'bg-danger/20 text-danger border-danger/40' },
};

export default function AuthNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="h-8 w-24 rounded-full bg-surface-2/60 animate-pulse border border-line" />
    );
  }

  if (user) {
    const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.client;
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    const canSeeAdmin = user.role === 'admin' || user.role === 'superadmin';
    const canSeeSuperadmin = user.role === 'superadmin';

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Navigation links visible only for staff/admins */}
        {(canSeeAdmin || canSeeSuperadmin) && (
          <nav aria-label="Navegación de gestión" className="flex items-center gap-1 rounded-full border border-line bg-surface/80 p-1 text-xs">
            <Link
              href="/"
              className={`rounded-full px-2.5 py-1 font-medium transition ${
                pathname === '/'
                  ? 'bg-gold text-night font-semibold shadow-sm shadow-gold/20'
                  : 'text-muted hover:text-cream hover:bg-surface-2'
              }`}
            >
              Reservas
            </Link>
            {canSeeAdmin && (
              <Link
                href="/admin"
                className={`rounded-full px-2.5 py-1 font-medium transition ${
                  pathname === '/admin'
                    ? 'bg-gold text-night font-semibold shadow-sm shadow-gold/20'
                    : 'text-muted hover:text-cream hover:bg-surface-2'
                }`}
              >
                Panel Sede
              </Link>
            )}
            {canSeeSuperadmin && (
              <Link
                href="/superadmin"
                className={`rounded-full px-2.5 py-1 font-medium transition ${
                  pathname === '/superadmin'
                    ? 'bg-gold text-night font-semibold shadow-sm shadow-gold/20'
                    : 'text-muted hover:text-cream hover:bg-surface-2'
                }`}
              >
                Superadmin
              </Link>
            )}
          </nav>
        )}

        {/* User profile badge */}
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface/90 px-2.5 py-1 text-xs">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold font-bold text-xs border border-gold/40">
            {initial}
          </span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-semibold text-cream leading-tight text-xs max-w-[110px] truncate">
              {user.name}
            </span>
            <span
              className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full border ${roleMeta.color} font-medium uppercase tracking-wider w-fit`}
            >
              {roleMeta.label}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={() => logout()}
          title="Cerrar sesión"
          className="rounded-full border border-line bg-surface/80 p-1.5 text-muted hover:border-danger/50 hover:bg-danger/10 hover:text-danger transition text-xs flex items-center justify-center size-8"
          aria-label="Cerrar sesión"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/login"
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-cream transition border border-transparent hover:border-line"
      >
        Entrar
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-gold/15 px-3.5 py-1.5 text-xs font-semibold text-gold border border-gold/40 hover:bg-gold hover:text-night transition shadow-sm shadow-gold/10"
      >
        Registrarse
      </Link>
    </div>
  );
}
