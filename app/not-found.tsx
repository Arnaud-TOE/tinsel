import Link from 'next/link';
import { Logo } from '@/components/logo';

const SNOW = Array.from({ length: 18 }, (_, i) => i);

// A wrong address still lands somewhere friendly, with the way into the demo.
export default function NotFound() {
  return (
    <main className="festive-hero relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <span className="snow" aria-hidden>
        {SNOW.map((i) => (
          <i key={i} />
        ))}
      </span>
      <div className="relative max-w-lg text-center">
        <Logo className="mx-auto size-14" />
        <p className="mt-6 font-display text-8xl font-semibold tracking-tight text-[var(--berry)]">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">This gift got lost in the post.</h1>
        <p className="mt-3 text-[var(--muted)]">Nothing was charged. The exchange is right this way.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/exchange" className="rounded-xl bg-[var(--pine)] px-6 py-3 font-semibold text-white hover:bg-[var(--pine-dark)]">
            Start the demo exchange
          </Link>
          <Link href="/" className="rounded-xl border border-[var(--line-strong)] bg-white px-6 py-3 font-semibold">
            Front page
          </Link>
        </div>
      </div>
    </main>
  );
}
