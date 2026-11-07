'use client';

import dynamic from 'next/dynamic';

// The exchange lives in the browser's storage, so it only ever runs there.
const ExchangeApp = dynamic(() => import('./exchange-app'), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center text-sm text-[var(--muted)]">Opening the exchange…</div>,
});

export function ExchangeLoader({ clientId }: { clientId: string }) {
  return <ExchangeApp clientId={clientId} />;
}
