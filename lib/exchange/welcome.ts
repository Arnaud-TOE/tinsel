// What Tinsel says to someone who comes back on a later day: where their exchange stands and what to do next.

import { activePeople, openingDay, stageOf } from './state';
import type { Exchange } from './types';

const DAY_MS = 86_400_000;

function daysUntil(day: string, today: Date): number {
  return Math.round((Date.parse(`${day.slice(0, 10)}T12:00:00Z`) - Date.parse(`${today.toISOString().slice(0, 10)}T12:00:00Z`)) / DAY_MS);
}

export function welcomeBack(exchange: Exchange, today = new Date()): string | null {
  const stage = stageOf(exchange);
  const people = activePeople(exchange).length;
  const bought = Object.keys(exchange.bought).length;
  const days = daysUntil(exchange.date, today);
  const when = days > 1 ? `on ${openingDay(exchange)}, in ${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : `on ${openingDay(exchange)}`;
  switch (stage) {
    case 'cancelled':
      return null;
    case 'revealed':
      return 'Welcome back. Your exchange is wrapped: open the gifts again, or start a new one with Start over.';
    case 'reveal':
      return `Welcome back. All ${bought} gifts are bought, and they open ${when}.`;
    case 'holds':
      return 'Welcome back. Your exchange is waiting for budgets on PayPal before the names are drawn.';
    default:
      return `Welcome back. ${bought} of ${people} gifts are bought so far, and the gifts open ${when}. Ask Tinsel to carry on.`;
  }
}
