import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import AdminPanel from '@/features/admin/components/AdminPanel';
import RoleGuard from '@/features/auth/components/RoleGuard';

export const metadata: Metadata = {
  title: 'Panel de Administración',
  description: 'Gestión de citas, agenda diaria, equipo de barberos y servicios por sede en CutFlow.',
};

export default function AdminPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <RoleGuard allowedRoles={['admin', 'superadmin']}>
          <div className="mb-6">
            <p className="eyebrow">Administración</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl text-cream">
              Panel de Sede
            </h1>
            <p className="mt-1 text-sm text-muted">
              Monitorea la agenda en tiempo real, reprograma o cancela citas y gestiona barberos y tarifas.
            </p>
          </div>

          <AdminPanel />
        </RoleGuard>
      </main>
      <footer className="border-t border-line/60 py-6 text-center text-xs text-muted flex flex-col items-center gap-2">
        <Image
          src="/images/logo.png"
          alt="CutFlow Barbería"
          width={660}
          height={313}
          className="h-6 w-auto opacity-60 hover:opacity-90 transition-opacity"
        />
        <p>CutFlow Admin · Sistema de Agendamiento O(log n)</p>
      </footer>
    </>
  );
}
