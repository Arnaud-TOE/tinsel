import { describe, expect, it } from 'vitest';
import { demoExchange } from '@/lib/exchange/demo';
import type { Exchange, Hold } from '@/lib/exchange/types';
import { welcomeBack } from '@/lib/exchange/welcome';

const START = new Date('2026-11-07T12:00:00Z'); // the gifts open 21 days later: Sat, Nov 28
const hold = (status: Hold['status'] = 'HELD'): Hold => ({ orderId: 'O', authorizationId: 'A', held: 30, status, placedWith: 'test-card' });

function held(): Exchange {
  const exchange = demoExchange(START);
  return { ...exchange, holds: Object.fromEntries(exchange.people.map((person) => [person.id, hold()])) };
}

function drawnWithPurchases(bought: number): Exchange {
  const exchange = held();
  const ids = exchange.people.map((person) => person.id);
  const draw = Object.fromEntries(ids.map((id, i) => [id, ids[(i + 1) % ids.length]]));
  const slots = Object.fromEntries(ids.map((id, i) => [`S${i + 1}`, id]));
  const purchases = Object.fromEntries(Object.keys(slots).slice(0, bought).map((slot) => [slot, { productId: 'p', price: 20 } as never]));
  return { ...exchange, draw, slots, bought: purchases };
}

describe('welcomeBack', () => {
  it('says how far the exchange has got and when the gifts open', () => {
    const today = new Date('2026-11-10T09:00:00Z');
    expect(welcomeBack(drawnWithPurchases(2), today)).toBe('Welcome back. 2 of 6 gifts are bought so far, and the gifts open on Sat, Nov 28, in 18 days. Ask Tinsel to carry on.');
  });

  it('waits for budgets before anything else', () => {
    expect(welcomeBack(demoExchange(START), START)).toBe('Welcome back. Your exchange is waiting for budgets on PayPal before the names are drawn.');
  });

  it('counts down once every gift is bought', () => {
    const exchange = { ...drawnWithPurchases(6), picks: {} };
    expect(welcomeBack(exchange, new Date('2026-11-27T20:00:00Z'))).toMatch(/^Welcome back\. All 6 gifts are bought, and they open tomorrow\.$/);
  });

  it('offers a new exchange once the gifts are open', () => {
    expect(welcomeBack({ ...drawnWithPurchases(6), revealed: true }, START)).toContain('start a new one');
  });

  it('says nothing about a cancelled exchange', () => {
    expect(welcomeBack({ ...held(), cancelled: true }, START)).toBeNull();
  });
});
