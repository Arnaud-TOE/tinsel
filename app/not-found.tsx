import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Logo } from '@/components/logo';

const NIGHT = { '--night': '#05130b', '--glow-a': '#e0b04a', '--glow-b': '#e0323d', '--glow-c': '#2f9e5b' } as CSSProperties;
const SNOW = Array.from({ length: 18 }, (_, i) => i);

// A wrong address still lands somewhere friendly, with the way into the demo.
export default function NotFound() {
  return (
    <main className="night grain grid min-h-dvh place-items-center overflow-hidden px-6" style={NIGHT}>
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <span className="snow snow-night" aria-hidden>
        {SNOW.map((i) => (
          <i key={i} />
        ))}
      </span>
      <div className="relative max-w-lg text-center">
        <Logo className="mx-auto size-14" />
        <p className="shimmer-text mt-6 font-display text-[8rem] font-semibold leading-none tracking-tight">404</p>
        <h1 className="text-balance mt-4 font-display text-4xl font-semibold">This gift got lost in the post.</h1>
        <p className="mt-3 text-white/60">Nothing was charged. The exchange is right this way.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/exchange" className="btn-glow rounded-full px-7 py-3.5 font-bold">
            Start the demo exchange
          </Link>
          <Link href="/" className="btn-ghost rounded-full px-7 py-3.5 font-bold">
            Front page
          </Link>
        </div>
      </div>
    </main>
  );
}
