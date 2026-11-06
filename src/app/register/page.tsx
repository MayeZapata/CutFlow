import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Crear Cuenta | CutFlow',
  description: 'Regístrate como cliente en CutFlow para reservar citas en minutos.',
};

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <RegisterForm />
      </main>
      <footer className="border-t border-line/60 py-6 text-center text-xs text-muted flex flex-col items-center gap-2">
        <Image
          src="/images/logo.png"
          alt="CutFlow Barbería"
          width={660}
          height={313}
          className="h-6 w-auto opacity-60 hover:opacity-90 transition-opacity"
        />
        <p>CutFlow Barbería · Experiencia Segura de Autenticación</p>
      </footer>
    </>
  );
}
