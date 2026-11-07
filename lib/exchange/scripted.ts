// The whole run without a model, using the same tools. When the demo's AI budget is used up, the
// exchange still works: searches come from the words in each profile, and reasons say so.

import { deciderOf, slotList, stageOf } from './state';
import { TOOLS, type Outcome, type ToolContext } from './tools';
import type { Exchange, Product } from './types';

/** The first few things someone likes, as searches: "Mechanical keyboards, board games and hot sauce". */
export function searchesFromLikes(likes: string): string[] {
  return likes
    .split(/,| and /)
    .map((part) => part.replace(/\b(very|handmade|commuting by|presents that get used up)\b/gi, '').trim())
    .filter((part) => part.length > 2)
    .slice(0, 2);
}

const score = (product: Product) => (product.rating ?? 3.5) * Math.log10((product.reviews ?? 0) + 10);

/** Three good ideas: the best rated, and not three from one brand if there's a choice. */
export function bestThree(products: Product[], avoid: string): Product[] {
  const words = avoid.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3);
  const allowed = products.filter((product) => !words.some((word) => product.title.toLowerCase().includes(word)));
  const ranked = [...allowed].sort((a, b) => score(b) - score(a));
  const brands = new Set<string>();
  const distinct = ranked.filter((product) => {
    const brand = product.brand ?? product.id;
    if (brands.has(brand)) return false;
    brands.add(brand);
    return true;
  });
  return [...distinct, ...ranked.filter((product) => !distinct.includes(product))].slice(0, 3);
}

export type Step = (name: string, run: () => Promise<Outcome> | Outcome) => Promise<Outcome>;

/** Runs every step it can: stops where a person has to choose. */
export async function runScripted(context: ToolContext, step: Step): Promise<void> {
  const call = (name: string, args: Record<string, unknown> = {}) => step(name, () => TOOLS[name].run(args, context));
  const current = (): Exchange => context.get();

  if (stageOf(current()) === 'holds') return;
  if (!current().draw) await call('drawNames');

  await Promise.all(
    slotList(current())
      .filter((slot) => !current().ideas[slot]?.length && !current().bought[slot])
      .map(async (slot) => {
        const giver = current().slots?.[slot] ?? '';
        const recipientId = current().draw?.[giver];
        const recipient = current().people.find((person) => person.id === recipientId);
        if (!recipient) return;
        if (recipient.wishlistUrl) await call('checkWishlist', { slot });
        if (recipient.photoUrl) await call('searchByPhoto', { slot });
        for (const liked of searchesFromLikes(recipient.likes)) await call('searchGifts', { slot, query: `gift for someone who loves ${liked.toLowerCase()}` });
        const candidates = current().candidates[slot] ?? [];
        const shared = recipient.wishlistUrl || recipient.photoUrl ? candidates[0] : undefined;
        const others = bestThree(candidates.filter((product) => product !== shared), recipient.avoid);
        const found = shared ? [shared, ...others].slice(0, 3) : others;
        if (found.length === 0) return;
        const liked = searchesFromLikes(recipient.likes).join(' and ').toLowerCase();
        const sharedReason = recipient.wishlistUrl ? "Close to what's on their wishlist, and under the budget." : 'It looks like the photo they shared.';
        await call('proposeIdeas', { slot, ideas: found.map((product) => ({ productId: product.id, reason: product === shared ? sharedReason : `Well rated, and it fits a love of ${liked}.` })) });
      }),
  );

  for (const slot of slotList(current())) {
    if (current().bought[slot]) continue;
    if (deciderOf(current(), slot) === 'tinsel' && !current().picks[slot] && current().ideas[slot]?.length) {
      await call('pickGift', { slot, productId: current().ideas[slot][0].product.id, why: 'The best rated of the three.' });
    }
    if (current().picks[slot]) await call('buyGift', { slot });
  }
}
