import Link from 'next/link';
import Image from 'next/image';
import AuthNav from './AuthNav';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-night/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-lg shrink-0"
          aria-label="CutFlow Barbería - Inicio"
        >
          <Image
            src="/images/logo.png"
            alt="CutFlow Barbería"
            width={660}
            height={313}
            priority
            className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </Link>
        <AuthNav />
      </div>
    </header>
  );
}
