'use client';

import { slotOfGiver } from '@/lib/exchange/state';
import type { Exchange, Person } from '@/lib/exchange/types';
import { PayPalHoldButton } from './paypal-hold-button';
import { ProfileEditor } from './profile-editor';
import type { ExchangeStore } from './store';

const AVATAR_COLORS = ['#14532d', '#b4232c', '#a16207', '#1e3a5f', '#6b2d5c', '#0f766e'];
const usd = (amount: number) => `$${amount.toFixed(2)}`;

export function PersonCard({ store, exchange, person, placing, clientId }: { store: ExchangeStore; exchange: Exchange; person: Person; placing: boolean; clientId: string }) {
  const out = exchange.droppedOut.includes(person.id);
  const index = exchange.people.findIndex((candidate) => candidate.id === person.id);
  const initials = person.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  const slot = slotOfGiver(exchange, person.id);

  return (
    <article className={`person-card rounded-2xl border bg-white p-4 ${person.isYou ? 'person-you border-[var(--pine)]' : 'border-[var(--line)]'} ${out ? 'opacity-60' : ''}`}>
      <header className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white shadow-md ring-2 ring-white" style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[index % AVATAR_COLORS.length]}cc, ${AVATAR_COLORS[index % AVATAR_COLORS.length]})` }}>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{person.name}</span>
            {person.isYou && <span className="shrink-0 rounded-full bg-[var(--wash)] px-1.5 py-0.5 text-xs font-medium text-[var(--muted)]">you</span>}
          </h3>
          <p className="truncate text-xs text-[var(--muted)]">{person.team}</p>
        </div>
      </header>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--ink)]">{person.likes}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-[var(--muted)]">Not: {person.avoid}</p>
        {person.isYou && !exchange.draw && <ProfileEditor store={store} person={person} budget={exchange.budget} />}
      </div>
      {(person.wishlistUrl || person.photoUrl) && (
        <p className="mt-1 text-xs text-[var(--pine)]">
          {[person.wishlistUrl && 'Shared a wishlist link', person.photoUrl && 'Shared a photo'].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="mt-3 min-h-14 border-t border-[var(--line)] pt-3">
        <HoldState store={store} exchange={exchange} person={person} placing={placing} clientId={clientId} />
        {!out && slot && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Envelope />
            {exchange.bought[slot] ? 'Gift bought' : exchange.picks[slot] ? 'Gift chosen' : exchange.ideas[slot]?.length ? `${exchange.ideas[slot].length} ideas ready` : 'Has drawn a name'}
          </p>
        )}
      </div>
    </article>
  );
}

function HoldState({ store, exchange, person, placing, clientId }: { store: ExchangeStore; exchange: Exchange; person: Person; placing: boolean; clientId: string }) {
  const hold = exchange.holds[person.id];
  const budget = exchange.budget;

  if (!hold) {
    if (placing) return <p className="hold-placing text-sm text-[var(--muted)]">Placing {usd(budget)} hold…</p>;
    if (!person.isYou) {
      return (
        <p className="text-sm text-[var(--muted)]">
          Waiting for their hold.{' '}
          <button type="button" className="underline hover:text-[var(--ink)]" onClick={() => void store.startColleagues()}>
            Try again
          </button>
        </p>
      );
    }
    return (
      <div>
        <p className="text-sm font-medium">Your turn: hold {usd(budget)}. It&rsquo;s reserved, not charged.</p>
        <PayPalHoldButton store={store} clientId={clientId} />
        <p className="mt-1 text-xs text-[var(--muted)]">PayPal&rsquo;s window will say &ldquo;Complete Purchase&rdquo;. It only places the hold.</p>
        <button type="button" className="mt-1.5 text-xs text-[var(--muted)] underline hover:text-[var(--ink)]" onClick={() => void store.holdYoursWithTestCard()}>
          Skip the sign-in: use a sandbox test card
        </button>
      </div>
    );
  }

  if (hold.status === 'RELEASED') return <p className="text-sm text-[var(--muted)]">Hold released: {usd(hold.held)} back in full</p>;

  if (hold.status === 'CHARGED') {
    const charged = hold.charged ?? 0;
    const share = hold.held > 0 ? Math.round((charged / hold.held) * 100) : 0;
    return (
      <div>
        <p className="text-sm">
          <strong className="font-semibold tabular-nums">{usd(charged)}</strong> charged
          <span className="text-[var(--pine)]"> · {usd(hold.released ?? 0)} released</span>
        </p>
        <div className="money-bar mt-1.5" role="img" aria-label={`${share}% of the hold charged`}>
          <i style={{ width: `${share}%` }} />
        </div>
      </div>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-sm">
      <span className="hold-dot" aria-hidden />
      <strong className="font-semibold tabular-nums">{usd(hold.held)}</strong> held on PayPal
    </p>
  );
}

function Envelope() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="m2 4.5 6 4.5 6-4.5" />
    </svg>
  );
}
