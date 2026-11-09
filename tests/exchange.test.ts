import { describe, expect, it, vi } from 'vitest';
import { demoExchange, DEMO_PEOPLE } from '@/lib/exchange/demo';
import { assignSlots, drawNames, isValidDraw, repairDraw } from '@/lib/exchange/draw';
import { afterFinishing, bestThree, finishRun, isUnfinished, runScripted, searchesFromLikes } from '@/lib/exchange/scripted';
import { anonymousRecipient, deciderOf, missingHolds, recipientOfSlot, slotList, stageOf, totals } from '@/lib/exchange/state';
import { TOOL_SCHEMAS, TOOLS, type Shop, type ToolContext } from '@/lib/exchange/tools';
import type { Exchange, Hold, Product } from '@/lib/exchange/types';

// A repeatable random source, so a failing test can be replayed.
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const ids = DEMO_PEOPLE.map((person) => person.id);

const product = (id: string, price: number, extra: Partial<Product> = {}): Product => ({ id, title: `Product ${id}`, price, merchant: 'shop.example', url: `https://shop.example/${id}`, rating: 4.5, reviews: 100, ...extra });

const hold = (id: string): Hold => ({ orderId: `order-${id}`, authorizationId: `auth-${id}`, held: 30, status: 'HELD', placedWith: 'test-card' });

function withHolds(exchange: Exchange = demoExchange(new Date('2026-11-07T12:00:00Z'))): Exchange {
  return { ...exchange, holds: Object.fromEntries(exchange.people.map((person) => [person.id, hold(person.id)])) };
}

function fakeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    search: vi.fn(async (query: string) => [product(`${query}-1`, 20), product(`${query}-2`, 25), product(`${query}-3`, 28)]),
    searchByPhoto: vi.fn(async () => [product('photo-1', 18)]),
    lookup: vi.fn(async () => product('wish', 48)),
    similar: vi.fn(async () => [product('near-1', 24), product('near-2', 29)]),
    buy: vi.fn(async (_auth: string, productId: string) => ({ product: product(productId, 25), charged: 25, released: 5, captureId: `capture-${productId}` })),
    release: vi.fn(async () => undefined),
    ...overrides,
  };
}

function contextFor(start: Exchange, shop: Shop = fakeShop(), confirm = true) {
  let exchange = start;
  const context: ToolContext = {
    get: () => exchange,
    set: (next) => {
      exchange = next;
    },
    shop,
    random: seeded(7),
    confirm: async () => confirm,
  };
  return { context, shop, current: () => exchange };
}

const run = (name: string, args: Record<string, unknown>, context: ToolContext) => Promise.resolve(TOOLS[name].run(args, context));

describe('drawNames', () => {
  it('always gives everyone one person to buy for, and never themselves', () => {
    for (let seed = 1; seed < 300; seed++) {
      const draw = drawNames(ids, [], seeded(seed));
      expect(draw && isValidDraw(draw, ids)).toBe(true);
    }
  });

  it('never leaves two people simply swapping gifts', () => {
    for (let seed = 1; seed < 300; seed++) {
      const draw = drawNames(ids, [], seeded(seed))!;
      for (const giver of ids) expect(draw[draw[giver]]).not.toBe(giver);
    }
  });

  it('keeps apart the people it should', () => {
    for (let seed = 1; seed < 300; seed++) {
      const draw = drawNames(ids, [['ben', 'priya']], seeded(seed))!;
      expect(draw.ben).not.toBe('priya');
      expect(draw.priya).not.toBe('ben');
    }
  });

  it('says so when the rules leave no way to draw', () => {
    expect(drawNames(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['a', 'c']], seeded(3))).toBeNull();
    expect(drawNames(['a'], [], seeded(3))).toBeNull();
  });

  it('is not always the same draw', () => {
    const draws = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(drawNames(ids, [], seeded(i + 1)))));
    expect(draws.size).toBeGreaterThan(10);
  });
});

describe('isValidDraw', () => {
  it('catches someone left out, or getting two gifts', () => {
    expect(isValidDraw({ a: 'b', b: 'a' }, ['a', 'b', 'c'])).toBe(false);
    expect(isValidDraw({ a: 'b', b: 'b', c: 'a' }, ['a', 'b', 'c'])).toBe(false);
    expect(isValidDraw({ a: 'a', b: 'c', c: 'b' }, ['a', 'b', 'c'])).toBe(false);
  });
});

describe('repairDraw', () => {
  const circle = { a: 'b', b: 'c', c: 'd', d: 'a' };

  it('hands the leaver’s person to whoever had the leaver, touching one giver', () => {
    const repair = repairDraw(circle, 'b')!;
    expect(repair.draw).toEqual({ a: 'c', c: 'd', d: 'a' });
    expect(repair.changed).toEqual(['a']);
  });

  it('swaps one more giver when the rules forbid the simple repair', () => {
    const repair = repairDraw({ a: 'b', b: 'c', c: 'd', d: 'e', e: 'a' }, 'b', [['a', 'c']])!;
    expect(repair.changed).toHaveLength(2);
    expect(isValidDraw(repair.draw, ['a', 'c', 'd', 'e'], [['a', 'c']])).toBe(true);
  });

  it('rearranges everyone free when no single swap works', () => {
    const apart: [string, string][] = [['a', 'c'], ['c', 'd']];
    const repair = repairDraw({ a: 'b', b: 'c', c: 'd', d: 'e', e: 'a' }, 'b', apart)!;
    expect(repair.draw).toEqual({ a: 'd', c: 'e', d: 'a', e: 'c' });
    expect(repair.changed.sort()).toEqual(['a', 'c', 'd', 'e']);
  });

  it('says so when the rules leave no way to repair', () => {
    expect(repairDraw(circle, 'b', [['a', 'c']])).toBeNull();
  });

  it('leaves locked givers alone when it rearranges', () => {
    const repair = repairDraw({ a: 'b', b: 'c', c: 'd', d: 'e', e: 'a' }, 'b', [['a', 'c']], new Set(['e']))!;
    expect(repair.draw.e).toBe('a');
    expect(isValidDraw(repair.draw, ['a', 'c', 'd', 'e'], [['a', 'c']])).toBe(true);
  });

  it('keeps a valid draw whoever leaves, with the demo’s rules', () => {
    const apart: [string, string][] = [['ben', 'priya']];
    for (let seed = 1; seed < 100; seed++) {
      const draw = drawNames(ids, apart, seeded(seed))!;
      for (const leaving of ids) {
        const repair = repairDraw(draw, leaving, apart);
        if (repair) expect(isValidDraw(repair.draw, ids.filter((id) => id !== leaving), apart)).toBe(true);
      }
    }
  });

  it('won’t change the person of a giver who has already bought', () => {
    expect(repairDraw(circle, 'b', [], new Set(['a']))).toBeNull();
  });

  it('gives up when there’s nobody left to swap with', () => {
    expect(repairDraw({ a: 'b', b: 'a' }, 'b')).toBeNull();
  });
});

describe('assignSlots', () => {
  it('gives every giver one slot, in an order that doesn’t follow the team', () => {
    const slots = assignSlots(ids, seeded(11));
    expect(Object.values(slots).sort()).toEqual([...ids].sort());
    expect(Object.values(slots)).not.toEqual(ids);
  });
});

describe('stageOf', () => {
  it('walks through the exchange', () => {
    const start = demoExchange();
    expect(stageOf(start)).toBe('holds');
    const held = withHolds(start);
    expect(stageOf(held)).toBe('draw');
    const drawn = { ...held, draw: { sam: 'maya', maya: 'sam' }, slots: { 'slot-1': 'sam', 'slot-2': 'maya' } };
    expect(stageOf(drawn)).toBe('ideas');
    const idea = [{ product: product('p', 20), reason: 'r' }];
    const ideas = { ...drawn, ideas: { 'slot-1': idea, 'slot-2': idea } };
    expect(stageOf(ideas)).toBe('picks');
    const picks = { ...ideas, picks: { 'slot-1': { productId: 'p', by: 'giver' as const }, 'slot-2': { productId: 'p', by: 'tinsel' as const } } };
    expect(stageOf(picks)).toBe('buy');
    const purchase = { product: product('p', 20), charged: 20, released: 10, captureId: 'c' };
    const bought = { ...picks, bought: { 'slot-1': purchase, 'slot-2': purchase } };
    expect(stageOf(bought)).toBe('reveal');
    expect(stageOf({ ...bought, revealed: true })).toBe('revealed');
    expect(stageOf({ ...bought, cancelled: true })).toBe('cancelled');
  });
});

describe('what the assistant can see', () => {
  it('knows tastes, and no names', async () => {
    const { context, current } = contextFor(withHolds());
    const drawn = await run('drawNames', {}, context);
    const everyName = current().people.flatMap((person) => person.name.split(' '));
    for (const slot of slotList(current())) expect(JSON.stringify(anonymousRecipient(current(), slot))).not.toMatch(new RegExp(everyName.join('|')));
    const slotsOnly = JSON.stringify(JSON.parse(drawn.reply).slots);
    for (const name of everyName) expect(slotsOnly).not.toContain(name);
    expect(slotsOnly).not.toMatch(/sam|maya|ben|priya|jonas|lucia/);
  });

  it('never learns who has whom from any tool’s answer about a slot', async () => {
    const { context, current } = contextFor(withHolds());
    await run('drawNames', {}, context);
    const overview = JSON.parse((await run('checkExchange', {}, context)).reply);
    for (const slot of overview.slots) {
      expect(slot).not.toHaveProperty('giver');
      expect(JSON.stringify(slot.recipient)).not.toContain(recipientOfSlot(current(), slot.slot)!.name);
    }
    // It does read the team list, for chasing holds, but nothing ties a name to a slot.
    expect(overview.people[0]).toEqual({ name: 'Sam Ellis', hold: 'held' });
  });
});

describe('drawNames tool', () => {
  it('waits until everyone has placed a hold', async () => {
    const start = demoExchange();
    const { context, current } = contextFor({ ...start, holds: { maya: hold('maya') } });
    const outcome = await run('drawNames', {}, context);
    expect(outcome.failed).toBe(true);
    expect(outcome.reply).toContain('Sam Ellis');
    expect(current().draw).toBeNull();
    expect(missingHolds(current())).toHaveLength(5);
  });

  it('draws once, and says which rules it kept', async () => {
    const { context, current } = contextFor(withHolds());
    const outcome = await run('drawNames', {}, context);
    expect(isValidDraw(current().draw!, ids, current().keptApart)).toBe(true);
    expect(JSON.parse(outcome.reply).rules.join(' ')).toContain("Ben and Priya can't draw each other");
    expect((await run('drawNames', {}, context)).failed).toBe(true);
  });
});

async function drawn(shop = fakeShop()) {
  const setup = contextFor(withHolds(), shop);
  await run('drawNames', {}, setup.context);
  return setup;
}

describe('shopping tools', () => {
  it('searches under the budget, and remembers what it found', async () => {
    const { context, current, shop } = await drawn();
    const [slot] = slotList(current());
    const outcome = await run('searchGifts', { slot, query: 'matcha bowl' }, context);
    expect(shop.search).toHaveBeenCalledWith('matcha bowl', 30);
    expect(JSON.parse(outcome.reply).products).toHaveLength(3);
    expect(current().candidates[slot]).toHaveLength(3);
  });

  it('refuses a slot that doesn’t exist', async () => {
    const { context } = await drawn();
    expect((await run('searchGifts', { slot: 'slot-99', query: 'tea' }, context)).failed).toBe(true);
  });

  it('finds similar products when a wishlist item is over budget', async () => {
    const { context, current, shop } = await drawn();
    const [slot] = slotList(current());
    const recipient = recipientOfSlot(current(), slot)!;
    const people = current().people.map((person) => (person.id === recipient.id ? { ...person, wishlistUrl: 'https://shop.example/wish' } : person));
    context.set({ ...current(), people });
    const answer = JSON.parse((await run('checkWishlist', { slot }, context)).reply);
    expect(answer.withinBudget).toBe(false);
    expect(answer.similarUnderBudget).toHaveLength(2);
    expect(shop.similar).toHaveBeenCalledWith('wish', 30);
    expect(current().candidates[slot].map((candidate) => candidate.id)).toEqual(['near-1', 'near-2']);
  });

  it('keeps a wishlist item that fits', async () => {
    const shop = fakeShop({ lookup: vi.fn(async () => product('wish', 22)) });
    const { context, current } = await drawn(shop);
    const [slot] = slotList(current());
    const recipient = recipientOfSlot(current(), slot)!;
    context.set({ ...current(), people: current().people.map((person) => (person.id === recipient.id ? { ...person, wishlistUrl: 'https://shop.example/wish' } : person)) });
    expect(JSON.parse((await run('checkWishlist', { slot }, context)).reply).withinBudget).toBe(true);
    expect(shop.similar).not.toHaveBeenCalled();
    expect(current().candidates[slot][0].id).toBe('wish');
  });

  it('says so when a slot’s recipient shared no link or photo', async () => {
    const { context, current } = await drawn();
    const [slot] = slotList(current());
    expect((await run('checkWishlist', { slot }, context)).failed).toBe(true);
    expect((await run('searchByPhoto', { slot }, context)).failed).toBe(true);
  });
});

describe('proposeIdeas', () => {
  it('only takes products the tools found for that slot', async () => {
    const { context, current } = await drawn();
    const [slot, other] = slotList(current());
    await run('searchGifts', { slot: other, query: 'tea' }, context);
    const outcome = await run('proposeIdeas', { slot, ideas: [{ productId: 'tea-1', reason: 'Nice' }] }, context);
    expect(outcome.failed).toBe(true);
    expect(outcome.reply).toContain("didn't come from a search");
    expect(current().ideas[slot]).toBeUndefined();
  });

  it('refuses a made-up product, and anything over budget', async () => {
    const { context, current } = await drawn();
    const [slot] = slotList(current());
    context.set({ ...current(), candidates: { [slot]: [product('dear', 31), product('fine', 30)] } });
    expect((await run('proposeIdeas', { slot, ideas: [{ productId: 'dreamt-up', reason: 'x' }] }, context)).failed).toBe(true);
    expect((await run('proposeIdeas', { slot, ideas: [{ productId: 'dear', reason: 'x' }] }, context)).failed).toBe(true);
    expect((await run('proposeIdeas', { slot, ideas: [{ productId: 'fine', reason: 'x' }] }, context)).failed).toBeUndefined();
  });

  it('takes at most three', async () => {
    const { context, current } = await drawn();
    const [slot] = slotList(current());
    const four = ['a', 'b', 'c', 'd'];
    context.set({ ...current(), candidates: { [slot]: four.map((id) => product(id, 20)) } });
    expect((await run('proposeIdeas', { slot, ideas: four.map((productId) => ({ productId, reason: 'x' })) }, context)).failed).toBe(true);
  });
});

async function withIdeas(shop = fakeShop()) {
  const setup = await drawn(shop);
  for (const slot of slotList(setup.current())) {
    await run('searchGifts', { slot, query: 'tea' }, setup.context);
    await run('proposeIdeas', { slot, ideas: [{ productId: 'tea-1', reason: 'Good' }, { productId: 'tea-2', reason: 'Good' }] }, setup.context);
  }
  return setup;
}

const slotOf = (exchange: Exchange, giver: string) => Object.entries(exchange.slots!).find(([, id]) => id === giver)![0];

describe('pickGift', () => {
  it('chooses for a giver who asked it to', async () => {
    const { context, current } = await withIdeas();
    const slot = slotOf(current(), 'maya');
    expect(deciderOf(current(), slot)).toBe('tinsel');
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    expect(current().picks[slot]).toMatchObject({ productId: 'tea-1', by: 'tinsel' });
  });

  it('won’t choose for a giver who chooses for themselves', async () => {
    const { context, current } = await withIdeas();
    const slot = slotOf(current(), 'sam');
    expect((await run('pickGift', { slot, productId: 'tea-1' }, context)).failed).toBe(true);
    expect(current().picks[slot]).toBeUndefined();
  });

  it('won’t pick anything but a proposed idea', async () => {
    const { context, current } = await withIdeas();
    expect((await run('pickGift', { slot: slotOf(current(), 'maya'), productId: 'tea-3' }, context)).failed).toBe(true);
  });
});

describe('buyGift', () => {
  it('charges the exact price to the giver’s hold, and records what came back', async () => {
    const shop = fakeShop();
    const { context, current } = await withIdeas(shop);
    const slot = slotOf(current(), 'maya');
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    const answer = JSON.parse((await run('buyGift', { slot }, context)).reply);
    expect(shop.buy).toHaveBeenCalledWith('auth-maya', 'tea-1');
    expect(answer).toMatchObject({ held: '$30.00', charged: '$25.00', releasedBackToGiver: '$5.00' });
    expect(current().holds.maya).toMatchObject({ status: 'CHARGED', charged: 25, released: 5, captureId: 'capture-tea-1' });
    expect(current().bought[slot].charged).toBe(25);
  });

  it('notes when the price moved between the idea and the purchase', async () => {
    const { context, current } = await withIdeas();
    const slot = slotOf(current(), 'maya');
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    const answer = JSON.parse((await run('buyGift', { slot }, context)).reply);
    expect(answer.priceMovedFrom).toBe('$20.00');
    expect(current().bought[slot].earlierPrice).toBe(20);
  });

  it('won’t buy what nobody chose, or buy twice', async () => {
    const { context, current } = await withIdeas();
    const slot = slotOf(current(), 'maya');
    expect((await run('buyGift', { slot }, context)).failed).toBe(true);
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    await run('buyGift', { slot }, context);
    expect((await run('buyGift', { slot }, context)).failed).toBe(true);
  });

  it('keeps a slot number that no longer exists between the model and itself', async () => {
    const { context } = await withIdeas();
    const outcome = await run('buyGift', { slot: 'slot-99' }, context);
    expect(outcome).toMatchObject({ failed: true, quiet: true });
    expect(outcome.note).toBeUndefined();
  });

  it('leaves the hold alone when the purchase fails, so another idea can be tried', async () => {
    const shop = fakeShop({ buy: vi.fn(async () => { throw new Error('It sold out.'); }) });
    const { context, current } = await withIdeas(shop);
    const slot = slotOf(current(), 'maya');
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    const outcome = await run('buyGift', { slot }, context);
    expect(outcome.failed).toBe(true);
    expect(outcome.reply).toContain('The hold is untouched');
    expect(current().holds.maya.status).toBe('HELD');
    expect(current().picks[slot]).toBeUndefined();
    expect(current().bought[slot]).toBeUndefined();
  });

  it('has no way to name its own price', () => {
    const buy = TOOL_SCHEMAS.find((tool) => tool.function.name === 'buyGift')!;
    expect(Object.keys(buy.function.parameters.properties)).toEqual(['slot']);
  });
});

describe('handleDropout', () => {
  it('releases the hold before the draw, and takes them off the list', async () => {
    const shop = fakeShop();
    const { context, current } = contextFor(withHolds(), shop);
    await run('handleDropout', { person: 'Ben' }, context);
    expect(shop.release).toHaveBeenCalledWith('auth-ben');
    expect(current().droppedOut).toEqual(['ben']);
    expect(current().holds.ben.status).toBe('RELEASED');
  });

  it('repairs the draw, keeps everyone else’s work and says who needs new ideas', async () => {
    const shop = fakeShop();
    const { context, current } = await withIdeas(shop);
    const before = current();
    const answer = JSON.parse((await run('handleDropout', { person: 'Ben Adeyemi' }, context)).reply);
    expect(shop.release).toHaveBeenCalledWith('auth-ben');
    expect(isValidDraw(current().draw!, ids.filter((id) => id !== 'ben'), current().keptApart)).toBe(true);
    expect(answer.slotsThatNeedNewIdeas.length).toBeGreaterThanOrEqual(1);
    const redo = answer.slotsThatNeedNewIdeas.map((slot: { slot: string }) => slot.slot);
    for (const slot of redo) expect(current().ideas[slot]).toBeUndefined();
    const kept = slotList(current()).filter((slot) => !redo.includes(slot));
    expect(kept.length).toBe(answer.everyoneElseUntouched);
    for (const slot of kept) expect(current().ideas[slot]).toEqual(before.ideas[slot]);
    expect(slotList(current())).not.toContain(slotOf(before, 'ben'));
  });

  it('won’t let someone drop out once they’ve bought', async () => {
    const { context, current } = await withIdeas();
    const slot = slotOf(current(), 'ben');
    await run('pickGift', { slot, productId: 'tea-1' }, context);
    await run('buyGift', { slot }, context);
    const outcome = await run('handleDropout', { person: 'Ben' }, context);
    expect(outcome.failed).toBe(true);
    expect(current().droppedOut).toEqual([]);
  });

  it('asks the organizer about their own place', async () => {
    const { context } = contextFor(withHolds());
    expect((await run('handleDropout', { person: 'Sam' }, context)).failed).toBe(true);
  });

  it('doesn’t guess at names', async () => {
    const { context, shop } = contextFor(withHolds());
    expect((await run('handleDropout', { person: 'Bob' }, context)).failed).toBe(true);
    expect(shop.release).not.toHaveBeenCalled();
  });
});

describe('cancelExchange', () => {
  it('asks first, and releases every hold still in place', async () => {
    const shop = fakeShop();
    const { context, current } = contextFor(withHolds(), shop);
    await run('cancelExchange', {}, context);
    expect(shop.release).toHaveBeenCalledTimes(6);
    expect(current().cancelled).toBe(true);
    expect(Object.values(current().holds).every((entry) => entry.status === 'RELEASED')).toBe(true);
  });

  it('does nothing if the organizer says no', async () => {
    const shop = fakeShop();
    const { context, current } = contextFor(withHolds(), shop, false);
    await run('cancelExchange', {}, context);
    expect(shop.release).not.toHaveBeenCalled();
    expect(current().cancelled).toBe(false);
  });
});

describe('totals', () => {
  it('adds up what was held, charged and released', () => {
    const exchange = withHolds();
    exchange.holds.maya = { ...hold('maya'), status: 'CHARGED', charged: 24.95, released: 5.05 };
    exchange.holds.ben = { ...hold('ben'), status: 'RELEASED' };
    expect(totals(exchange)).toEqual({ held: 180, stillHeld: 120, charged: 24.95, released: 35.05 });
  });
});

describe('when the assistant stops early', () => {
  const step = (_name: string, go: () => unknown) => Promise.resolve(go()) as never;
  const drawn = async (shop?: Shop) => {
    const made = contextFor(withHolds(), shop);
    await run('drawNames', {}, made.context);
    return made;
  };

  it('finds ideas for every slot and chooses for those who left it to Tinsel, without buying', async () => {
    const { context, current } = await drawn();
    expect(isUnfinished(current(), false)).toBe(true);
    await finishRun(context, step, false);
    expect(isUnfinished(current(), false)).toBe(false);
    expect(stageOf(current())).toBe('picks');
    expect(Object.keys(current().bought)).toHaveLength(0);
    expect(afterFinishing(current())).toContain('One giver is choosing');
  });

  it('buys what is chosen when it was asked to buy', async () => {
    const { context, current } = await drawn();
    await finishRun(context, step, true);
    expect(Object.keys(current().bought)).toHaveLength(5);
  });

  it('moves on to the next idea when a purchase fails', async () => {
    const buy = vi.fn(async (_auth: string, productId: string) => {
      if (buy.mock.calls.length === 1) throw new Error('Sold out.');
      return { product: product(productId, 25), charged: 25, released: 5, captureId: `capture-${productId}` };
    });
    const { context, current } = await drawn(fakeShop({ buy }));
    await finishRun(context, step, true);
    expect(Object.keys(current().bought)).toHaveLength(5);
  });

  it('falls back on a general search when nothing matches their tastes', async () => {
    const search = vi.fn(async (query: string) => (/useful everyday/.test(query) ? [product('general-1', 20)] : []));
    const { context, current } = await drawn(fakeShop({ search }));
    await finishRun(context, step, false);
    const slot = slotList(current())[0];
    expect(current().ideas[slot][0].reason).toBe('Well rated, and under the budget.');
  });

  it('asks a person to try again when the shops have nothing at all', async () => {
    const { context, current } = await drawn(fakeShop({ search: vi.fn(async () => []), searchByPhoto: vi.fn(async () => []), similar: vi.fn(async () => []) }));
    await finishRun(context, step, false);
    expect(afterFinishing(current())).toContain("couldn't find anything");
  });

  it('has nothing to finish before the names are drawn', () => {
    expect(isUnfinished(withHolds(), true)).toBe(false);
  });
});

describe('searching', () => {
  it('asks again as a gift when the shops find nothing for something narrow', async () => {
    const search = vi.fn(async (query: string) => (query.startsWith('gift for') ? [product('found', 20)] : []));
    const { context, current } = contextFor(withHolds(), fakeShop({ search }));
    await run('drawNames', {}, context);
    const slot = slotList(current())[0];
    await run('searchGifts', { slot, query: 'loose leaf tea' }, context);
    expect(search).toHaveBeenLastCalledWith('gift for someone who loves loose leaf tea', 30);
    expect(current().candidates[slot].map((item) => item.id)).toEqual(['found']);
  });

  it('keeps an idea from another slot between the model and itself', async () => {
    const { context, current } = contextFor(withHolds());
    await run('drawNames', {}, context);
    const outcome = await run('proposeIdeas', { slot: slotList(current())[0], ideas: [{ productId: 'nowhere', reason: 'x' }] }, context);
    expect(outcome).toMatchObject({ failed: true, quiet: true });
  });
});

describe('the run without a model', () => {
  it('turns tastes into searches', () => {
    expect(searchesFromLikes('Mechanical keyboards, board games and hot sauce')).toEqual(['Mechanical keyboards', 'board games']);
    expect(searchesFromLikes('Trail running and very strong coffee')).toEqual(['Trail running', 'strong coffee']);
  });

  it('prefers three different brands, and fills up if it has to', () => {
    const same = (id: string, rating: number) => product(id, 20, { brand: 'Fernwood', rating });
    const found = bestThree([same('a', 5), same('b', 4.9), product('c', 20, { brand: 'Oak', rating: 3 }), same('d', 4.8)], 'nothing');
    expect(found.map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('leaves out what someone said to avoid', () => {
    const found = bestThree([product('a', 20, { title: 'Wool socks' }), product('b', 20, { title: 'Hot sauce set' })], 'Socks');
    expect(found.map((item) => item.id)).toEqual(['b']);
  });

  it('runs everything except the choice that belongs to a person', async () => {
    const { context, current } = contextFor(withHolds());
    const step = (_name: string, go: () => unknown) => Promise.resolve(go()) as never;
    await runScripted(context, step);
    const you = slotOf(current(), 'sam');
    expect(current().ideas[you].length).toBeGreaterThan(0);
    expect(current().picks[you]).toBeUndefined();
    expect(current().bought[you]).toBeUndefined();
    expect(Object.keys(current().bought)).toHaveLength(5);
    expect(stageOf(current())).toBe('picks');
  });

  it('finishes once the person has chosen', async () => {
    const { context, current } = contextFor(withHolds());
    const step = (_name: string, go: () => unknown) => Promise.resolve(go()) as never;
    await runScripted(context, step);
    const you = slotOf(current(), 'sam');
    context.set({ ...current(), picks: { ...current().picks, [you]: { productId: current().ideas[you][0].product.id, by: 'giver' } } });
    await runScripted(context, step);
    expect(stageOf(current())).toBe('reveal');
  });

  it('puts what someone shared first', async () => {
    const exchange = withHolds();
    const people = exchange.people.map((person) => ({ ...person, wishlistUrl: person.id === 'jonas' ? 'https://shop.example/wish' : undefined, photoUrl: undefined }));
    const { context, current } = contextFor({ ...exchange, people });
    await runScripted(context, (_name, go) => Promise.resolve(go()) as never);
    const slot = slotList(current()).find((candidate) => recipientOfSlot(current(), candidate)?.id === 'jonas')!;
    expect(current().ideas[slot][0].product.id).toBe('near-1');
    expect(current().ideas[slot][0].reason).toContain('wishlist');
  });

  it("doesn't quote a wishlist it couldn't read", async () => {
    const exchange = withHolds();
    const people = exchange.people.map((person) => ({ ...person, wishlistUrl: person.id === 'jonas' ? 'https://shop.example/gone' : undefined, photoUrl: undefined }));
    const { context, current } = contextFor({ ...exchange, people }, fakeShop({ lookup: vi.fn(async () => null) }));
    await runScripted(context, (_name, go) => Promise.resolve(go()) as never);
    const slot = slotList(current()).find((candidate) => recipientOfSlot(current(), candidate)?.id === 'jonas')!;
    expect(current().ideas[slot].length).toBeGreaterThan(0);
    expect(current().ideas[slot].map((idea) => idea.reason).join(' ')).not.toContain('wishlist');
  });

  it('waits for holds', async () => {
    const { context, current } = contextFor(demoExchange());
    const step = (_name: string, go: () => unknown) => Promise.resolve(go()) as never;
    await runScripted(context, step);
    expect(current().draw).toBeNull();
  });
});

describe('handleDropout without a name', () => {
  it('asks for the name instead of reporting someone called undefined', async () => {
    const { context } = await drawn();
    const outcome = await run('handleDropout', {}, context);
    expect(outcome.failed).toBe(true);
    expect(outcome.reply).toContain('"person"');
    expect(outcome.reply).not.toContain('undefined');
  });
});
