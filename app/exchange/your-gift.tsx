'use client';

/* eslint-disable @next/next/no-img-element -- Product pictures come from thousands of shops. */

import { useState } from 'react';
import { recipientOfSlot } from '@/lib/exchange/state';
import type { Exchange, Idea } from '@/lib/exchange/types';
import type { ExchangeStore } from './store';

const usd = (amount: number) => `$${amount.toFixed(2)}`;

/** The one secret you're allowed to see: who you drew, and what Tinsel found for them. */
export function YourGift({ store, exchange, slot }: { store: ExchangeStore; exchange: Exchange; slot: string }) {
  const recipient = recipientOfSlot(exchange, slot);
  const ideas = exchange.ideas[slot] ?? [];
  const purchase = exchange.bought[slot];
  const pick = exchange.picks[slot];
  const [working, setWorking] = useState<string | null>(null);
  if (!recipient) return null;
  const first = recipient.name.split(' ')[0];

  const act = async (id: string, run: () => Promise<void>) => {
    setWorking(id);
    try {
      await run();
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="your-gift mt-5 rounded-2xl border border-[var(--pine)] bg-white p-5" aria-labelledby="your-gift-title">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--berry)]">Only you can see this</p>
      <h2 id="your-gift-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">
        You drew {recipient.name}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {first} loves: {recipient.likes.toLowerCase()}. Not: {recipient.avoid.toLowerCase()}
      </p>

      {purchase ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[var(--wash)] p-3">
          {purchase.product.image && <img src={purchase.product.image} alt="" className="size-20 rounded-lg bg-white object-contain" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{purchase.product.title}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Bought from {purchase.product.merchant}. {usd(purchase.charged)} charged to your hold, {usd(purchase.released)} released.
            </p>
            {purchase.earlierPrice !== undefined && <p className="mt-0.5 text-xs text-[var(--muted)]">The price moved from {usd(purchase.earlierPrice)} before buying, and Tinsel charged what it costs now.</p>}
          </div>
        </div>
      ) : ideas.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Tinsel is still looking. Your ideas will show up here.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.product.id}
                idea={idea}
                budget={exchange.budget}
                busy={Boolean(working) || Boolean(pick)}
                choosing={working === idea.product.id}
                finding={working === `more-${idea.product.id}`}
                onChoose={() => void act(idea.product.id, () => store.chooseIdea(slot, idea.product.id))}
                onMore={() => void act(`more-${idea.product.id}`, () => store.moreLikeThis(slot, idea.product))}
              />
            ))}
          </div>
          <button type="button" disabled={Boolean(working) || Boolean(pick)} className="mt-3 text-sm text-[var(--muted)] underline hover:text-[var(--ink)] disabled:opacity-50" onClick={() => void act('tinsel', () => store.letTinselChoose(slot))}>
            I can&rsquo;t decide. Let Tinsel choose.
          </button>
        </>
      )}
    </section>
  );
}

function IdeaCard({ idea, budget, busy, choosing, finding, onChoose, onMore }: { idea: Idea; budget: number; busy: boolean; choosing: boolean; finding: boolean; onChoose: () => void; onMore: () => void }) {
  const { product, reason } = idea;
  return (
    <article className="idea-card flex flex-col rounded-xl border border-[var(--line)] p-3">
      <div className="grid h-32 place-items-center rounded-lg bg-[var(--wash)]">
        {product.image ? <img src={product.image} alt="" className="max-h-28 max-w-full object-contain" loading="lazy" /> : <span className="text-xs text-[var(--muted)]">No picture</span>}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{product.title}</h3>
      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
        {product.brand ? `${product.brand} · ` : ''}
        <a href={product.url} target="_blank" rel="noreferrer" className="underline">
          {product.merchant}
        </a>
        {product.rating ? ` · ★ ${product.rating.toFixed(1)}` : ''}
      </p>
      <p className="mt-2 flex-1 text-xs italic leading-4 text-[var(--ink)]">{reason}</p>
      <p className="mt-2 text-sm">
        <strong className="font-semibold tabular-nums">{usd(product.price)}</strong>
        <span className="text-xs text-[var(--pine)]"> · {usd(budget - product.price)} goes back to you</span>
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" disabled={busy} onClick={onChoose} className="flex-1 rounded-lg bg-[var(--pine)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-dark)] disabled:opacity-50">
          {choosing ? 'Buying…' : 'Choose this'}
        </button>
        <button type="button" disabled={busy} onClick={onMore} className="rounded-lg border border-[var(--line)] px-2 py-2 text-xs hover:bg-[var(--wash)] disabled:opacity-50">
          {finding ? 'Looking…' : 'More like this'}
        </button>
      </div>
    </article>
  );
}
