// The assistant's tools, as plain functions over the exchange. The browser runs them, because the
// exchange lives there. Shopping and money go through `shop`, which calls this app's server.
//
// Two rules hold whatever the model asks for:
// - It never sees who drew whom: only numbered slots and anonymous tastes.
// - It can only spend through `buyGift`, on a chosen idea, and PayPal refuses anything above the hold.

import { assignSlots, drawNames as draw, repairDraw } from './draw';
import { activePeople, anonymousRecipient, deciderOf, missingHolds, openingDay, personById, recipientOfSlot, slotList, stageOf } from './state';
import type { Exchange, Idea, Product, Purchase } from './types';

/** What the tools can do outside the browser. */
export type Shop = {
  search(query: string, maxPrice: number): Promise<Product[]>;
  searchByPhoto(photoUrl: string, maxPrice: number): Promise<Product[]>;
  lookup(url: string): Promise<Product | null>;
  similar(productId: string, maxPrice: number): Promise<Product[]>;
  /** Re-checks the product and charges its current price to the hold. Refuses what the hold can't cover. */
  buy(authorizationId: string, productId: string): Promise<Omit<Purchase, 'product' | 'earlierPrice'> & { product: Product }>;
  release(authorizationId: string): Promise<void>;
};

export type ToolContext = {
  get(): Exchange;
  set(next: Exchange): void;
  shop: Shop;
  random?: () => number;
  /** Asks the organizer before anything that can't be taken back. */
  confirm(question: string): Promise<boolean>;
};

export type Outcome = {
  /** What the model reads. */
  reply: string;
  failed?: boolean;
  /** One line for the activity feed. */
  note?: string;
};

type Args = Record<string, unknown>;

type Property = { type: string; description: string; items?: Property; properties?: Record<string, Property>; required?: string[]; additionalProperties?: boolean };

export type Tool = {
  description: string;
  /** Shown in the feed while it runs. */
  status: string;
  properties: Record<string, Property>;
  required: string[];
  run(args: Args, context: ToolContext): Promise<Outcome> | Outcome;
};

const money = (amount: number) => `$${amount.toFixed(2)}`;
const refuse = (reply: string, note?: string): Outcome => ({ reply, failed: true, note: note ?? reply });
const json = (value: unknown, note?: string): Outcome => ({ reply: JSON.stringify(value), note });

const forModel = (product: Product) => ({
  id: product.id,
  title: product.title,
  ...(product.brand ? { brand: product.brand } : {}),
  price: money(product.price),
  store: product.merchant,
  ...(product.rating ? { rating: product.rating, reviews: product.reviews } : {}),
});

function slotOverview(exchange: Exchange, slot: string) {
  return {
    slot,
    recipient: anonymousRecipient(exchange, slot),
    decider: deciderOf(exchange, slot),
    ideas: exchange.ideas[slot]?.length ?? 0,
    picked: Boolean(exchange.picks[slot]),
    bought: Boolean(exchange.bought[slot]),
  };
}

function checkSlot(exchange: Exchange, slot: unknown): string | Outcome {
  const id = String(slot ?? '');
  if (!exchange.slots?.[id]) return refuse(`No slot "${id}". Call checkExchange for the slots.`);
  return id;
}

const addCandidates = (exchange: Exchange, slot: string, products: Product[]): Exchange => {
  const known = new Map((exchange.candidates[slot] ?? []).map((product) => [product.id, product]));
  for (const product of products) known.set(product.id, product);
  return { ...exchange, candidates: { ...exchange.candidates, [slot]: [...known.values()] } };
};

function checkExchange(_args: Args, { get }: ToolContext): Outcome {
  const exchange = get();
  const missing = missingHolds(exchange);
  return json({
    stage: stageOf(exchange),
    exchange: exchange.name,
    budgetPerPerson: money(exchange.budget),
    giftsOpenOn: openingDay(exchange),
    people: activePeople(exchange).map((person) => ({ name: person.name, hold: exchange.holds[person.id]?.status.toLowerCase() ?? 'none' })),
    waitingForHolds: missing.map((person) => person.name),
    slots: slotList(exchange).map((slot) => slotOverview(exchange, slot)),
  });
}

function drawTool(_args: Args, { get, set, random }: ToolContext): Outcome {
  const exchange = get();
  if (exchange.draw) return refuse('Names are already drawn.');
  const missing = missingHolds(exchange);
  if (missing.length > 0) return refuse(`Not everyone has placed their hold yet: ${missing.map((person) => person.name).join(', ')}.`);
  const ids = activePeople(exchange).map((person) => person.id);
  const drawn = draw(ids, exchange.keptApart, random);
  if (!drawn) return refuse('The rules leave no way to draw these names. The organizer has to relax who is kept apart.');
  const next: Exchange = { ...exchange, draw: drawn, slots: assignSlots(ids, random) };
  set(next);
  const apart = exchange.keptApart.map(([a, b]) => `${personById(exchange, a)?.name.split(' ')[0]} and ${personById(exchange, b)?.name.split(' ')[0]} can't draw each other`);
  return json(
    {
      drawn: ids.length,
      rules: ['Nobody drew themselves', 'No two people simply swap gifts', ...apart],
      secrecy: 'You see slots and anonymous tastes. Only each giver sees who they drew.',
      slots: slotList(next).map((slot) => slotOverview(next, slot)),
    },
    `Names drawn for ${ids.length} people. Nobody can see the draw, including me.`,
  );
}

async function searchGifts(args: Args, { get, set, shop }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  const query = String(args.query ?? '').trim();
  if (!query) return refuse('Say what to search for.');
  const products = await shop.search(query, exchange.budget);
  set(addCandidates(get(), slot, products));
  return json({ query, underBudget: money(exchange.budget), products: products.slice(0, 8).map(forModel) }, `"${query}": ${products.length} in stock under ${money(exchange.budget)}`);
}

async function searchByPhoto(args: Args, { get, set, shop }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  const photo = recipientOfSlot(exchange, slot)?.photoUrl;
  if (!photo) return refuse('This person shared no photo.');
  const products = await shop.searchByPhoto(photo, exchange.budget);
  set(addCandidates(get(), slot, products));
  return json({ products: products.slice(0, 8).map(forModel) }, `Searched by their photo: ${products.length} look alike`);
}

async function checkWishlist(args: Args, { get, set, shop }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  const url = recipientOfSlot(exchange, slot)?.wishlistUrl;
  if (!url) return refuse('This person shared no wishlist link.');
  const wanted = await shop.lookup(url);
  if (!wanted) return refuse("That link isn't a product we can read. Search from their tastes instead.");
  if (wanted.price <= exchange.budget) {
    set(addCandidates(get(), slot, [wanted]));
    return json({ withinBudget: true, product: forModel(wanted) }, `Their wishlist item fits: ${money(wanted.price)}`);
  }
  const similar = await shop.similar(wanted.id, exchange.budget);
  set(addCandidates(get(), slot, similar));
  return json(
    { withinBudget: false, wanted: forModel(wanted), similarUnderBudget: similar.slice(0, 8).map(forModel) },
    `Their wishlist item is ${money(wanted.price)}, over budget. Found ${similar.length} similar for less.`,
  );
}

function proposeIdeas(args: Args, { get, set }: ToolContext): Outcome {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  if (exchange.bought[slot]) return refuse('That gift is already bought.');
  const given = (Array.isArray(args.ideas) ? args.ideas : []) as { productId?: string; reason?: string }[];
  if (given.length < 1 || given.length > 3) return refuse('Propose between 1 and 3 ideas.');

  const candidates = exchange.candidates[slot] ?? [];
  const ideas: Idea[] = [];
  for (const { productId, reason } of given) {
    const product = candidates.find((candidate) => candidate.id === productId);
    if (!product) return refuse(`Product ${productId} didn't come from a search for this slot. Only propose what the tools found.`);
    if (product.price > exchange.budget) return refuse(`${product.title} is ${money(product.price)}, over the ${money(exchange.budget)} budget.`);
    ideas.push({ product, reason: String(reason ?? '').slice(0, 160) });
  }
  const { [slot]: _dropped, ...otherPicks } = exchange.picks;
  void _dropped;
  set({ ...exchange, ideas: { ...exchange.ideas, [slot]: ideas }, picks: otherPicks });
  return json({ slot, ideas: ideas.length, decider: deciderOf(exchange, slot) }, `${ideas.length} ideas ready for one giver`);
}

function pickGift(args: Args, { get, set }: ToolContext): Outcome {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  if (deciderOf(exchange, slot) !== 'tinsel') return refuse('This giver chooses for themselves. Wait for them, unless they ask you to choose.');
  const productId = String(args.productId ?? '');
  if (!exchange.ideas[slot]?.some((idea) => idea.product.id === productId)) return refuse('Pick one of the ideas you proposed for this slot.');
  set({ ...exchange, picks: { ...exchange.picks, [slot]: { productId, by: 'tinsel', why: args.why ? String(args.why).slice(0, 160) : undefined } } });
  return { reply: `Picked for ${slot}.`, note: 'Chose a gift for a giver who asked me to' };
}

async function buyGift(args: Args, { get, set, shop }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const slot = checkSlot(exchange, args.slot);
  if (typeof slot !== 'string') return slot;
  if (exchange.bought[slot]) return refuse('That gift is already bought.');
  const pick = exchange.picks[slot];
  if (!pick) return refuse(`No gift has been chosen for ${slot} yet.`);
  const giver = exchange.slots?.[slot] ?? '';
  const hold = exchange.holds[giver];
  if (!hold || hold.status !== 'HELD') return refuse('This giver has no budget held on PayPal.');
  const idea = exchange.ideas[slot]?.find((candidate) => candidate.product.id === pick.productId);

  let purchase;
  try {
    purchase = await shop.buy(hold.authorizationId, pick.productId);
  } catch (error) {
    // Sold out or too expensive now: the giver's hold is untouched, so another idea can still be bought.
    const current = get();
    const { [slot]: _gone, ...picks } = current.picks;
    void _gone;
    set({ ...current, picks });
    return refuse(`Not bought: ${(error as Error).message} The hold is untouched. Choose another idea.`, `Couldn't buy it: ${(error as Error).message}`);
  }

  const moved = idea && idea.product.price !== purchase.product.price ? idea.product.price : undefined;
  const current = get();
  set({
    ...current,
    holds: {
      ...current.holds,
      [giver]: { ...hold, status: 'CHARGED', charged: purchase.charged, released: purchase.released, captureId: purchase.captureId },
    },
    bought: { ...current.bought, [slot]: { ...purchase, ...(moved !== undefined ? { earlierPrice: moved } : {}) } },
  });
  return json(
    { slot, bought: purchase.product.title, store: purchase.product.merchant, held: money(hold.held), charged: money(purchase.charged), releasedBackToGiver: money(purchase.released), ...(moved !== undefined ? { priceMovedFrom: money(moved) } : {}) },
    `Bought from ${purchase.product.merchant}: held ${money(hold.held)}, charged ${money(purchase.charged)}, ${money(purchase.released)} released`,
  );
}

async function handleDropout(args: Args, { get, set, shop }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const given = args.person ?? args.name ?? Object.values(args).find((value) => typeof value === 'string');
  if (typeof given !== 'string' || !given.trim()) return refuse('Say who is out: call this again with their name as "person".', 'Asking who is out');
  const wanted = given.trim().toLowerCase();
  const person = activePeople(exchange).find((candidate) => candidate.name.toLowerCase() === wanted || candidate.name.toLowerCase().split(' ').includes(wanted));
  if (!person) return refuse(`Nobody here is called "${given.trim()}".`);
  if (person.isYou) return refuse('Ask the organizer to confirm that themselves.');
  const hold = exchange.holds[person.id];
  if (hold?.status === 'CHARGED') return refuse(`${person.name} has already bought their gift, so they can't drop out now.`);

  if (!exchange.draw) {
    if (hold) await shop.release(hold.authorizationId);
    set({ ...exchange, droppedOut: [...exchange.droppedOut, person.id], holds: hold ? { ...exchange.holds, [person.id]: { ...hold, status: 'RELEASED' } } : exchange.holds });
    return json({ out: person.name, holdReleased: Boolean(hold) }, `${person.name} is out, and their hold is released`);
  }

  const lockedGivers = new Set(Object.entries(exchange.slots ?? {}).filter(([slot]) => exchange.bought[slot]).map(([, giver]) => giver));
  const repair = repairDraw(exchange.draw, person.id, exchange.keptApart, lockedGivers);
  if (!repair) return refuse(`A gift for ${person.name} is already bought, so I can't repair this without the organizer.`);

  if (hold) await shop.release(hold.authorizationId);

  const slots = { ...exchange.slots };
  const leavingSlot = Object.keys(slots).find((slot) => slots[slot] === person.id);
  if (leavingSlot) delete slots[leavingSlot];
  const affected = Object.keys(slots).filter((slot) => repair.changed.includes(slots[slot]));
  const clear = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([slot]) => slot !== leavingSlot && !affected.includes(slot)));
  const current = get();
  const next: Exchange = {
    ...current,
    draw: repair.draw,
    slots,
    droppedOut: [...current.droppedOut, person.id],
    holds: hold ? { ...current.holds, [person.id]: { ...hold, status: 'RELEASED' } } : current.holds,
    candidates: clear(current.candidates),
    ideas: clear(current.ideas),
    picks: clear(current.picks),
  };
  set(next);
  return json(
    { out: person.name, holdReleased: Boolean(hold), slotsThatNeedNewIdeas: affected.map((slot) => slotOverview(next, slot)), everyoneElseUntouched: slotList(next).length - affected.length },
    `${person.name} is out and their hold is released. ${affected.length} giver${affected.length === 1 ? ' has' : 's have'} a new person; the rest stay as they are.`,
  );
}

async function cancelExchange(_args: Args, { get, set, shop, confirm }: ToolContext): Promise<Outcome> {
  const exchange = get();
  const live = Object.entries(exchange.holds).filter(([, hold]) => hold.status === 'HELD');
  const agreed = await confirm(`Cancel the exchange and release ${live.length} PayPal holds?`);
  if (!agreed) return { reply: 'The organizer said no. Nothing changed.', note: 'The organizer kept the exchange going' };
  await Promise.all(live.map(([, hold]) => shop.release(hold.authorizationId)));
  const holds = { ...get().holds };
  for (const [id, hold] of live) holds[id] = { ...hold, status: 'RELEASED' };
  set({ ...get(), holds, cancelled: true });
  return json({ cancelled: true, holdsReleased: live.length }, `Exchange cancelled. ${live.length} holds released on PayPal.`);
}

export const TOOLS: Record<string, Tool> = {
  checkExchange: {
    description: 'Reads where the exchange stands: the stage, the budget, who has placed a hold, and each anonymous slot. Call it first.',
    status: 'Checking the exchange',
    properties: {},
    required: [],
    run: checkExchange,
  },
  drawNames: {
    description: 'Draws names once everyone has placed a hold. The draw is random and secret: you get numbered slots with anonymous tastes, never names.',
    status: 'Drawing names',
    properties: {},
    required: [],
    run: drawTool,
  },
  searchGifts: {
    description: 'Searches real products in stock, new, under the budget. Say what you want in a few words, one kind of thing per search, like "ceramic matcha bowl" or "baking tools for a keen home baker".',
    status: 'Searching the shops',
    properties: {
      slot: { type: 'string', description: 'Which slot this is for' },
      query: { type: 'string', description: 'One product type and its details' },
    },
    required: ['slot', 'query'],
    run: searchGifts,
  },
  searchByPhoto: {
    description: "Finds products that look like the photo a slot's recipient shared. Only when their profile says photo: true.",
    status: 'Searching by photo',
    properties: { slot: { type: 'string', description: 'Which slot this is for' } },
    required: ['slot'],
    run: searchByPhoto,
  },
  checkWishlist: {
    description: "Reads the wishlist link a slot's recipient shared. If it is over budget, also finds similar products under budget. Only when their profile says wishlistLink: true.",
    status: 'Reading the wishlist link',
    properties: { slot: { type: 'string', description: 'Which slot this is for' } },
    required: ['slot'],
    run: checkWishlist,
  },
  proposeIdeas: {
    description: 'Saves up to 3 gift ideas for a slot, from products the tools found for that slot, each with a short reason that fits the tastes. Never use a name.',
    status: 'Writing up the ideas',
    properties: {
      slot: { type: 'string', description: 'Which slot this is for' },
      ideas: {
        type: 'array',
        description: 'The ideas, best first',
        items: {
          type: 'object',
          description: 'One idea',
          properties: {
            productId: { type: 'string', description: 'A product id from a search result for this slot' },
            reason: { type: 'string', description: 'Why it suits them, in under 15 words' },
          },
          required: ['productId', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['slot', 'ideas'],
    run: proposeIdeas,
  },
  pickGift: {
    description: 'Chooses one of the proposed ideas for a slot whose decider is "tinsel". It refuses slots whose giver chooses for themselves.',
    status: 'Choosing a gift',
    properties: {
      slot: { type: 'string', description: 'Which slot this is for' },
      productId: { type: 'string', description: 'The chosen idea' },
      why: { type: 'string', description: 'Why this one, in under 15 words' },
    },
    required: ['slot', 'productId'],
    run: pickGift,
  },
  buyGift: {
    description: "Buys a slot's chosen gift: re-checks the price and stock, then charges the exact price to the giver's PayPal hold and releases the rest. PayPal refuses anything above the hold.",
    status: 'Charging the exact price',
    properties: { slot: { type: 'string', description: 'Which slot this is for' } },
    required: ['slot'],
    run: buyGift,
  },
  handleDropout: {
    description: "Someone is out. Releases their PayPal hold and repairs the draw so that everyone still gets a gift, changing as little as possible. It says which slots need new ideas.",
    status: 'Repairing the draw',
    properties: { person: { type: 'string', description: 'Who is out' } },
    required: ['person'],
    run: handleDropout,
  },
  cancelExchange: {
    description: 'Cancels the whole exchange and releases every hold. The organizer has to confirm on screen.',
    status: 'Asking the organizer',
    properties: {},
    required: [],
    run: cancelExchange,
  },
};

export const INSTRUCTIONS = `You are Tinsel. You run a team's gift exchange from start to finish, so that the organizer doesn't have to chase anyone.

How the exchange goes: everyone places a budget hold on PayPal; you draw names; you find ideas for each giver; a gift gets chosen; you buy it, charging the exact price to that giver's hold.

To run the exchange:
1. Call checkExchange. If holds are missing, say who you're waiting for and stop.
2. Call drawNames.
3. For every slot, in one go, make one to three shopping calls: searchGifts with one product type per search, plus checkWishlist or searchByPhoto when the profile mentions them. Stick to what they like, and stay away from what they said to avoid.
4. Call proposeIdeas for every slot, with 3 ideas that really fit. Prefer well-rated products, and don't propose three of the same thing.
5. For slots whose decider is "tinsel", call pickGift. Don't wait to be asked: those givers already said yes. Don't buy yet: until the gifts are bought, someone can still drop out.
6. For slots whose decider is "giver", stop and tell the owner their ideas are ready.

When the organizer says to buy the gifts, call buyGift for every slot that has a chosen gift and isn't bought yet.

Secrecy: you can't know who drew whom, and that is deliberate. You only see slots and tastes. If anyone asks who has whom, say so plainly. Never guess, and never put a name in a reason.

Money: you can only spend through buyGift, on a gift that has been chosen. Holds are ceilings set by PayPal, and you can't exceed them. If a purchase fails, the hold is untouched: choose another idea, or tell the owner.

When someone drops out, call handleDropout with their name as "person", then search and propose again for the slots it names, and pick if their decider is "tinsel".

Style: warm, brief and specific, always in English. Two or three short sentences at the end of a run, with the money. No lists of products: the screen shows them. Slots are your own bookkeeping: never mention a slot or its number to people. Say "one giver is choosing their own gift" instead.`;

/** The tool list in the shape the model expects. Kept on the server's side of the proxy too, so the browser can't add to it. */
export const TOOL_SCHEMAS = Object.entries(TOOLS).map(([name, tool]) => ({
  type: 'function' as const,
  function: {
    name,
    description: tool.description,
    parameters: { type: 'object', properties: tool.properties, required: tool.required },
  },
}));
