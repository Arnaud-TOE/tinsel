// Reading an exchange: where it stands and who is in it. Everything shown on screen and told to the
// assistant comes from here, so they can't disagree.

import type { Exchange, Person, Stage } from './types';

export const activePeople = (exchange: Exchange): Person[] => exchange.people.filter((person) => !exchange.droppedOut.includes(person.id));

export const personById = (exchange: Exchange, id: string) => exchange.people.find((person) => person.id === id);

export const slotList = (exchange: Exchange): string[] => Object.keys(exchange.slots ?? {});

export const slotOfGiver = (exchange: Exchange, giverId: string): string | undefined =>
  Object.entries(exchange.slots ?? {}).find(([, giver]) => giver === giverId)?.[0];

export const recipientOfSlot = (exchange: Exchange, slot: string): Person | undefined => {
  const giver = exchange.slots?.[slot];
  const recipient = giver ? exchange.draw?.[giver] : undefined;
  return recipient ? personById(exchange, recipient) : undefined;
};

/** Who still has to place their budget hold. */
export const missingHolds = (exchange: Exchange): Person[] => activePeople(exchange).filter((person) => !exchange.holds[person.id]);

export function stageOf(exchange: Exchange): Stage {
  if (exchange.cancelled) return 'cancelled';
  if (exchange.revealed) return 'revealed';
  if (missingHolds(exchange).length > 0) return 'holds';
  if (!exchange.draw) return 'draw';
  const slots = slotList(exchange);
  if (slots.some((slot) => !exchange.bought[slot] && !exchange.ideas[slot]?.length)) return 'ideas';
  if (slots.some((slot) => !exchange.bought[slot] && !exchange.picks[slot])) return 'picks';
  if (slots.some((slot) => !exchange.bought[slot])) return 'buy';
  return 'reveal';
}

/**
 * What the assistant may know about one slot's recipient: tastes, nothing that identifies them.
 * The name stays in the browser.
 */
export function anonymousRecipient(exchange: Exchange, slot: string) {
  const recipient = recipientOfSlot(exchange, slot);
  if (!recipient) return null;
  return {
    likes: recipient.likes,
    avoid: recipient.avoid,
    ...(recipient.wishlistUrl ? { wishlistLink: true } : {}),
    ...(recipient.photoUrl ? { photo: true } : {}),
  };
}

/** Who decides what a slot gives: the giver, or the assistant if the giver said so. */
export const deciderOf = (exchange: Exchange, slot: string): 'giver' | 'tinsel' => {
  const giver = personById(exchange, exchange.slots?.[slot] ?? '');
  return giver?.letTinselPick ? 'tinsel' : 'giver';
};

export type Totals = { held: number; charged: number; released: number };

/** Money across the exchange, for the ledger and the reveal. */
export function totals(exchange: Exchange): Totals {
  const holds = Object.values(exchange.holds);
  const sum = (pick: (hold: (typeof holds)[number]) => number) => Math.round(holds.reduce((total, hold) => total + pick(hold), 0) * 100) / 100;
  return {
    held: sum((hold) => hold.held),
    charged: sum((hold) => hold.charged ?? 0),
    released: sum((hold) => (hold.status === 'RELEASED' ? hold.held : (hold.released ?? 0))),
  };
}

const prettyDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const openingDay = (exchange: Exchange) => prettyDay(exchange.date);
