'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { ClockIcon, ShieldIcon, StarIcon } from '@/components/ui/icons';

const HIGHLIGHTS = [
  { icon: ShieldIcon, label: 'Sin choques de horario' },
  { icon: ClockIcon, label: 'Confirmación al instante' },
  { icon: StarIcon, label: 'Barberos 4.8★ en promedio' },
] as const;

export default function BookingHero() {
  const { user } = useAuth();

  // If user is not logged in, clicking 'Reservar ahora' takes them directly to login
  const targetHref = user ? '#reserva' : '/login?returnTo=/#reserva';

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/hero-barbershop.jpg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-right"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/85 to-night/10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-linear-to-t from-night to-transparent" />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-32 sm:px-6 sm:pt-24 lg:px-8 lg:pb-40">
        <p className="eyebrow animate-fade-up">Barbería premium · Medellín &amp; Bogotá</p>
        <h1 className="mt-4 max-w-2xl animate-fade-up font-display text-4xl leading-tight font-semibold tracking-tight [animation-delay:80ms] sm:text-5xl lg:text-6xl">
          Tu próximo corte, <span className="text-gradient-gold">sin esperas</span>.
        </h1>
        <p className="mt-5 max-w-xl animate-fade-up text-lg text-muted [animation-delay:160ms]">
          Elige sede, barbero y horario. Validamos la disponibilidad en tiempo real para que tu cita nunca se cruce
          con otra.
        </p>

        <ul className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-night/60 px-4 py-2 text-sm backdrop-blur"
            >
              <Icon className="size-4 text-gold" />
              {label}
            </li>
          ))}
        </ul>

        <Link
          href={targetHref}
          className="btn-primary mt-10 animate-fade-up [animation-delay:320ms] inline-flex items-center gap-2 shadow-lg shadow-gold/20"
        >
          <span>Reservar ahora</span>
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
