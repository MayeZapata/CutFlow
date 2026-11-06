import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import BookingHero from '@/features/booking/components/BookingHero';
import BookingPanel from '@/features/booking/components/BookingPanel';

export const metadata: Metadata = {
  title: 'Reserva tu cita',
  description:
    'Agenda tu corte en CutFlow: elige sede, barbero, servicio y horario con validación de disponibilidad al instante.',
};

export default function ClientHomePage() {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
        <BookingHero />
        <section id="reserva" className="relative mx-auto -mt-20 max-w-6xl scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-8">
          <BookingPanel />
        </section>
      </main>
      <footer className="border-t border-line/60 py-10 text-center text-sm text-muted flex flex-col items-center gap-3">
        <Image
          src="/images/logo.png"
          alt="CutFlow Barbería"
          width={660}
          height={313}
          className="h-7 w-auto opacity-75 hover:opacity-100 transition-opacity"
        />
        <p>© CutFlow · Hecho para barberías que no hacen esperar.</p>
      </footer>
    </>
  );
}
