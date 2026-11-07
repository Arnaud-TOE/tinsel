'use client';

import { useState } from 'react';
import { totals } from '@/lib/exchange/state';
import type { Exchange } from '@/lib/exchange/types';

const usd = (amount: number | undefined) => (amount === undefined ? '' : `$${amount.toFixed(2)}`);

/** PayPal's side of the story: every hold, with its real IDs. */
export function Ledger({ exchange }: { exchange: Exchange }) {
  const [open, setOpen] = useState(false);
  const rows = exchange.people.filter((person) => exchange.holds[person.id]);
  const sums = totals(exchange);

  return (
    <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white" aria-label="PayPal ledger">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="font-display text-lg font-semibold">PayPal ledger</span>
        <span className="text-sm text-[var(--muted)]">
          {rows.length} holds · {usd(sums.charged)} charged · {usd(sums.released)} released
        </span>
        <svg viewBox="0 0 20 20" className={`ml-auto size-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-[var(--line)]">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Person</th>
                <th className="px-4 py-2 text-right font-medium">Held</th>
                <th className="px-4 py-2 text-right font-medium">Charged</th>
                <th className="px-4 py-2 text-right font-medium">Released</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">PayPal authorization</th>
                <th className="px-4 py-2 font-medium">PayPal capture</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => {
                const hold = exchange.holds[person.id];
                return (
                  <tr key={person.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-1.5 font-medium">{person.name}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{usd(hold.held)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{usd(hold.charged)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-[var(--pine)]">{hold.status === 'RELEASED' ? usd(hold.held) : usd(hold.released)}</td>
                    <td className="px-4 py-1.5">
                      <span className={`status status-${hold.status.toLowerCase()}`}>{hold.status}</span>
                    </td>
                    <td className="px-4 py-1.5 font-mono text-xs">{hold.authorizationId}</td>
                    <td className="px-4 py-1.5 font-mono text-xs">{hold.captureId ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
