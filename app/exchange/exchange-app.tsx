'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Logo } from '@/components/logo';
import { openingDay, slotOfGiver, stageOf, totals } from '@/lib/exchange/state';
import type { Stage } from '@/lib/exchange/types';
import { AssistantPanel } from './assistant-panel';
import { Ledger } from './ledger';
import { PersonCard } from './person-card';
import { RevealRoom } from './reveal-room';
import { ExchangeStore } from './store';
import { YourGift } from './your-gift';

const STEPS: { id: Stage[]; label: string }[] = [
  { id: ['holds'], label: 'Budgets held' },
  { id: ['draw'], label: 'Names drawn' },
  { id: ['ideas'], label: 'Ideas found' },
  { id: ['picks'], label: 'Gifts chosen' },
  { id: ['buy'], label: 'Gifts bought' },
  { id: ['reveal', 'revealed'], label: 'Opened' },
];

const usd = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExchangeApp({ clientId }: { clientId: string }) {
  const [store] = useState(() => new ExchangeStore());
  const view = useSyncExternalStore(store.subscribe, store.getView, store.getView);
  const { exchange } = view;
  const stage = stageOf(exchange);
  const money = totals(exchange);
  const stepIndex = stage === 'cancelled' ? -1 : STEPS.findIndex((step) => step.id.includes(stage));

  useEffect(() => {
    void store.startColleagues();
  }, [store]);

  const yourSlot = slotOfGiver(exchange, store.you().id);

  return (
    <div className="flex h-dvh flex-col bg-[var(--cream)] text-[var(--ink)]">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-b border-[var(--line)] bg-white px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Logo className="size-6" />
          Tinsel
        </Link>
        <span className="hidden whitespace-nowrap text-sm text-[var(--muted)] min-[1440px]:inline">{exchange.name}</span>
        <dl className="ml-auto flex items-center gap-5 text-sm">
          <Fact label="Budget" value={`$${exchange.budget} each`} />
          <Fact label="Gifts open" value={openingDay(exchange)} />
          <Fact label="Held on PayPal" value={usd(money.stillHeld)} />
          <Fact label="Charged" value={usd(money.charged)} />
          <Fact label="Released" value={usd(money.released)} tone="pine" />
        </dl>
        <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--muted)]" title="Every hold and charge here runs on the PayPal sandbox. No real money moves, and no parcel ships.">
          PayPal sandbox
        </span>
        <button type="button" onClick={() => void store.startOver()} className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]">
          Start over
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {exchange.revealed ? (
            <RevealRoom exchange={exchange} />
          ) : (
            <div className="mx-auto max-w-5xl px-5 py-5">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Where the exchange stands">
                {STEPS.map((step, index) => {
                  const state = stepIndex < 0 ? 'off' : index < stepIndex ? 'done' : index === stepIndex ? 'now' : 'next';
                  return (
                    <li key={step.label} className={`step step-${state} flex items-center gap-1.5 text-sm`} aria-current={state === 'now' ? 'step' : undefined}>
                      <span className="step-mark grid size-5 place-items-center rounded-full text-[0.6875rem] font-semibold">{state === 'done' ? '✓' : index + 1}</span>
                      {step.label}
                      {index < STEPS.length - 1 && <span className="mx-1 text-[var(--line-strong)]" aria-hidden>→</span>}
                    </li>
                  );
                })}
              </ol>

              {stage === 'cancelled' && <p className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4 text-sm">This exchange is cancelled, and every hold still in place has been released on PayPal. Nobody was charged.</p>}

              {view.error && (
                <p role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <span className="flex-1">{view.error}</span>
                  <button type="button" className="font-semibold underline" onClick={() => store.clearError()}>
                    OK
                  </button>
                </p>
              )}

              {stage === 'reveal' && (
                <section className="reveal-ready mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--pine)] p-5 text-white">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-2xl font-semibold">Every gift is bought.</h2>
                    <p className="mt-1 text-sm opacity-90">
                      {usd(money.charged)} charged from {usd(money.held)} held, and {usd(money.released)} released. Nobody went over budget, and nobody had to chase anyone.
                    </p>
                  </div>
                  <button type="button" className="rounded-lg bg-white px-5 py-3 font-semibold text-[var(--pine)] hover:bg-[var(--cream)]" onClick={() => void store.reveal()}>
                    Open the gifts
                  </button>
                </section>
              )}

              {yourSlot && !exchange.cancelled && <YourGift store={store} exchange={exchange} slot={yourSlot} />}

              <section className="mt-6" aria-labelledby="team-title">
                <h2 id="team-title" className="font-display text-xl font-semibold tracking-tight">
                  The team
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {exchange.people.map((person) => (
                    <PersonCard key={person.id} store={store} exchange={exchange} person={person} placing={view.placing.includes(person.id)} clientId={clientId} />
                  ))}
                </div>
              </section>

              <Ledger exchange={exchange} />
            </div>
          )}
        </main>

        <AssistantPanel store={store} view={view} stage={stage} />
      </div>

      {view.question && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="question-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="question-title" className="font-display text-xl font-semibold">
              {view.question}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">This can&rsquo;t be undone. Everyone gets their whole budget back.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--wash)]" onClick={() => store.answer(false)}>
                Keep it going
              </button>
              <button type="button" className="rounded-lg bg-[var(--berry)] px-3 py-2 text-sm font-semibold text-white" onClick={() => store.answer(true)}>
                Cancel and release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: 'pine' }) {
  return (
    <div className="hidden items-baseline gap-1.5 xl:flex">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className={`font-semibold tabular-nums ${tone === 'pine' ? 'text-[var(--pine)]' : ''}`}>{value}</dd>
    </div>
  );
}
