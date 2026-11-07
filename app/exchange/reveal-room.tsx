'use client';

/* eslint-disable @next/next/no-img-element -- Product pictures come from thousands of shops. */

import { useState } from 'react';
import { recipientOfSlot, slotList, totals } from '@/lib/exchange/state';
import type { Exchange } from '@/lib/exchange/types';

const usd = (amount: number) => `$${amount.toFixed(2)}`;
const RIBBONS = ['#b4232c', '#14532d', '#a16207', '#1e3a5f', '#6b2d5c', '#0f766e'];

/** The day itself: a wrapped box for each person. Click to open. */
export function RevealRoom({ exchange }: { exchange: Exchange }) {
  const [opened, setOpened] = useState<string[]>([]);
  const slots = slotList(exchange);
  const sums = totals(exchange);
  const allOpen = opened.length === slots.length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Time to open them.</h1>
      <p className="mt-1 text-[var(--muted)]">Click a box. Who gave what stays secret until it&rsquo;s open.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, index) => {
          const recipient = recipientOfSlot(exchange, slot);
          const purchase = exchange.bought[slot];
          const giver = exchange.people.find((person) => person.id === exchange.slots?.[slot]);
          const isOpen = opened.includes(slot);
          if (!recipient || !purchase) return null;
          return (
            <article key={slot} className="gift" style={{ '--ribbon': RIBBONS[index % RIBBONS.length] } as React.CSSProperties}>
              <h2 className="text-center font-display text-lg font-semibold">For {recipient.name.split(' ')[0]}</h2>
              <button type="button" className={`gift-box ${isOpen ? 'gift-open' : ''}`} disabled={isOpen} onClick={() => setOpened((list) => [...list, slot])} aria-label={isOpen ? `${recipient.name}'s gift is open` : `Open ${recipient.name}'s gift`}>
                <span className="gift-prize">{(purchase.sticker || purchase.product.image) && <img src={purchase.sticker || purchase.product.image} alt="" />}</span>
                <span className="gift-body" aria-hidden />
                <span className="gift-lid" aria-hidden />
                {isOpen && <Confetti />}
              </button>
              <div className={`gift-card ${isOpen ? 'gift-card-shown' : ''}`} aria-hidden={!isOpen}>
                <p className="line-clamp-2 text-sm font-semibold leading-5">{purchase.product.title}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  From {giver?.name.split(' ')[0]}, via{' '}
                  <a href={purchase.product.url} target="_blank" rel="noreferrer" tabIndex={isOpen ? 0 : -1} className="underline">
                    {purchase.product.merchant}
                  </a>
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <section className={`mt-8 rounded-2xl bg-[var(--pine)] p-5 text-white transition-opacity ${allOpen ? 'opacity-100' : 'opacity-70'}`}>
        <h2 className="font-display text-2xl font-semibold">What it took</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm opacity-80">Held on PayPal</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{usd(sums.held)}</dd>
          </div>
          <div>
            <dt className="text-sm opacity-80">Charged</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{usd(sums.charged)}</dd>
          </div>
          <div>
            <dt className="text-sm opacity-80">Released back to people</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{usd(sums.released)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm opacity-90">No chasing, no spreadsheet, nobody forgotten. In this sandbox demo no parcels ship: a live version hands each order to a checkout partner.</p>
      </section>
    </div>
  );
}

const PIECES = Array.from({ length: 18 }, (_, i) => i);

function Confetti() {
  return (
    <span className="confetti" aria-hidden>
      {PIECES.map((piece) => (
        <i key={piece} style={{ '--i': piece } as React.CSSProperties} />
      ))}
    </span>
  );
}
