import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import DatabaseOverview from '@/features/superadmin/DatabaseOverview';
import StressLab from '@/features/stress-lab/StressLab';
import RoleGuard from '@/features/auth/components/RoleGuard';

export const metadata: Metadata = {
  title: 'Superadmin | Centro de Control',
  description: 'Panel de superadministración de CutFlow: monitoreo de base de datos y pruebas de rendimiento del motor de agendamiento.',
};

export default function SuperAdminPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <RoleGuard allowedRoles={['superadmin']}>
          <p className="eyebrow">Superadmin</p>
          <h1 className="mt-1 mb-8 font-display text-3xl font-semibold sm:text-4xl">Centro de control</h1>
          <DatabaseOverview />
          <StressLab />
        </RoleGuard>
      </main>
      <footer className="border-t border-line/60 py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
        <Image
          src="/images/logo.png"
          alt="CutFlow Barbería"
          width={660}
          height={313}
          className="h-6 w-auto opacity-60 hover:opacity-90 transition-opacity"
        />
        <p>CutFlow Superadmin · Centro de Control</p>
      </footer>
    </>
  );
}
