import Link from 'next/link';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <Link href="/exchange" className="font-display text-3xl">
        Start the demo exchange
      </Link>
    </main>
  );
}
