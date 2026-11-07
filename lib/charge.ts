// The last check before money moves, kept apart from the route so that the tests can pin it down.

import type { Product } from './exchange/types';

const money = (amount: number) => `$${amount.toFixed(2)}`;

export type ChargeDecision = { ok: true; amount: number; released: number } | { ok: false; message: string };

/** Whether a hold can pay for a product at the price it has right now. */
export function decideCharge(product: Product | null, hold: { status: string; held: number }): ChargeDecision {
  if (hold.status !== 'CREATED') return { ok: false, message: 'That hold has already been charged or released.' };
  if (!product) return { ok: false, message: "It isn't in stock anywhere right now." };
  if (product.price > hold.held) return { ok: false, message: `It costs ${money(product.price)} now, more than the ${money(hold.held)} held.` };
  return { ok: true, amount: product.price, released: Math.round((hold.held - product.price) * 100) / 100 };
}
