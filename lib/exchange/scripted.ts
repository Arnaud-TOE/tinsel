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

type Call = (name: string, args?: Record<string, unknown>) => Promise<Outcome>;
const caller = (context: ToolContext, step: Step): Call => (name, args = {}) => step(name, () => TOOLS[name].run(args, context));

// For someone whose tastes the shops can't match at all: better a good general present than nothing.
const BROAD_SEARCHES = ['useful everyday gift', 'popular gift'];

/** Finds and proposes ideas for every slot that has none. */
async function fillIdeas(context: ToolContext, call: Call) {
  const current = (): Exchange => context.get();
  await Promise.all(
    slotList(current())
      .filter((slot) => !current().ideas[slot]?.length && !current().bought[slot])
      .map(async (slot) => {
        const giver = current().slots?.[slot] ?? '';
        const recipientId = current().draw?.[giver];
        const recipient = current().people.find((person) => person.id === recipientId);
        if (!recipient) return;
        // A slot the assistant already searched for only needs its ideas written up.
        const searched = Boolean(current().candidates[slot]?.length);
        // What they shared only counts if it could be read: a broken link must not be quoted back as their wish.
        const wishlist = !searched && recipient.wishlistUrl ? await call('checkWishlist', { slot }) : null;
        const photo = !searched && recipient.photoUrl ? await call('searchByPhoto', { slot }) : null;
        const wishlistRead = wishlist !== null && !wishlist.failed;
        const photoRead = photo !== null && !photo.failed;
        if (!searched) for (const liked of searchesFromLikes(recipient.likes)) await call('searchGifts', { slot, query: `gift for someone who loves ${liked.toLowerCase()}` });
        const matched = Boolean(current().candidates[slot]?.length);
        for (const query of BROAD_SEARCHES) {
          if (current().candidates[slot]?.length) break;
          await call('searchGifts', { slot, query });
        }
        const candidates = current().candidates[slot] ?? [];
        const shared = wishlistRead || photoRead ? candidates[0] : undefined;
        const others = bestThree(candidates.filter((product) => product !== shared), recipient.avoid);
        const found = shared ? [shared, ...others].slice(0, 3) : others;
        if (found.length === 0) return;
        const liked = searchesFromLikes(recipient.likes).join(' and ').toLowerCase();
        const sharedReason = wishlistRead ? "Close to what's on their wishlist, and under the budget." : 'It looks like the photo they shared.';
        const reason = matched ? `Well rated, and it fits a love of ${liked}.` : 'Well rated, and under the budget.';
        await call('proposeIdeas', { slot, ideas: found.map((product) => ({ productId: product.id, reason: product === shared ? sharedReason : reason })) });
      }),
  );
}

/** Chooses for the givers who left it to Tinsel and, with `buy`, buys what is chosen. A purchase that fails moves on to the next idea. */
async function chooseAndBuy(context: ToolContext, call: Call, buy: boolean) {
  const current = (): Exchange => context.get();
  for (const slot of slotList(current())) {
    for (const idea of current().ideas[slot] ?? []) {
      if (current().bought[slot]) break;
      if (deciderOf(current(), slot) === 'tinsel' && !current().picks[slot]) await call('pickGift', { slot, productId: idea.product.id, why: 'The best rated of the three.' });
      if (!buy || !current().picks[slot]) break;
      await call('buyGift', { slot });
    }
  }
}

/** Runs every step it can: stops where a person has to choose. */
export async function runScripted(context: ToolContext, step: Step): Promise<void> {
  const call = caller(context, step);
  if (stageOf(context.get()) === 'holds') return;
  if (!context.get().draw) await call('drawNames');
  await fillIdeas(context, call);
  await chooseAndBuy(context, call, true);
}

/** Whether the assistant stopped with its part of the run undone: a slot with no ideas, a choice left to it, or, with `buy`, a gift chosen and not bought. */
export function isUnfinished(exchange: Exchange, buy: boolean): boolean {
  if (!exchange.draw || exchange.cancelled) return false;
  return slotList(exchange).some((slot) => {
    if (exchange.bought[slot]) return false;
    if (!exchange.ideas[slot]?.length) return true;
    if (!exchange.picks[slot]) return deciderOf(exchange, slot) === 'tinsel';
    return buy;
  });
}

/** Does what the assistant left undone, with the same tools. A model can stop early; the exchange shouldn't. */
export async function finishRun(context: ToolContext, step: Step, buy: boolean): Promise<void> {
  const call = caller(context, step);
  await fillIdeas(context, call);
  await chooseAndBuy(context, call, buy);
}

/** One plain line once the run has been finished for the assistant. Nothing once every gift is bought: that has its own line. */
export function afterFinishing(exchange: Exchange): string | null {
  const open = slotList(exchange).filter((slot) => !exchange.bought[slot]);
  const empty = open.filter((slot) => !exchange.ideas[slot]?.length).length;
  if (empty > 0) return `I couldn't find anything in stock under the budget for ${empty === 1 ? 'one giver' : `${empty} givers`}. Ask me to try again.`;
  const choosing = open.filter((slot) => !exchange.picks[slot]).length;
  if (choosing > 0) return `The ideas are ready. ${choosing === 1 ? 'One giver is' : `${choosing} givers are`} choosing their own gift, and the rest are chosen and waiting for the buy step.`;
  return open.length > 0 ? 'The gifts are chosen. Say when to buy them.' : null;
}
