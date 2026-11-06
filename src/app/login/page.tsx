import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import LoginForm from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | CutFlow',
  description: 'Inicia sesión en CutFlow para gestionar tus citas o administrar la barbería.',
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto rounded-3xl border border-line bg-surface/90 p-8 shadow-2xl flex items-center justify-center min-h-[350px]">
              <div className="size-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
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
