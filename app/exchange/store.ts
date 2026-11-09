// The exchange in the browser: one object that the screens read and the assistant's tools act on.
// There's no database: each visitor gets their own exchange, and their PayPal holds are real sandbox
// authorizations that this object keeps track of.

import type { HoldReceipt } from '@/lib/paypal';
import { withRetries } from '@/lib/retry';
import { welcomeBack } from '@/lib/exchange/welcome';
import { demoExchange } from '@/lib/exchange/demo';
import { afterFinishing, finishRun, isUnfinished, runScripted } from '@/lib/exchange/scripted';
import { activePeople, deciderOf, slotList, slotOfGiver, stageOf, totals } from '@/lib/exchange/state';
import { TOOLS, type Outcome, type Shop, type ToolContext } from '@/lib/exchange/tools';
import type { Exchange, Hold, Person, Product } from '@/lib/exchange/types';

const STORAGE_KEY = 'tinsel:v1';
const MAX_TURNS = 14;
const money = (amount: number) => `$${amount.toFixed(2)}`;

export type FeedItem =
  | { id: number; kind: 'you' | 'tinsel'; text: string }
  | { id: number; kind: 'tool'; status: string; note?: string; state: 'running' | 'done' | 'failed' };

type ModelMessage = { role: string; content?: string | null; tool_calls?: { id: string; type?: string; function: { name: string; arguments: string } }[]; tool_call_id?: string };

export type View = {
  exchange: Exchange;
  feed: FeedItem[];
  /** The assistant is working. */
  busy: boolean;
  /** The model is out of budget or not set up, so the run without it is on offer. */
  modelDown: boolean;
  /** Colleagues whose holds are being placed right now. */
  placing: string[];
  question: string | null;
  error: string | null;
  /** Said once to someone back on a later day: where their exchange stands. */
  welcome: string | null;
};

const LAST_VISIT_KEY = 'tinsel:lastVisit';

/** Reads the day of the last visit, then records today's. */
function lastVisitDay(today: string): string | null {
  try {
    const last = localStorage.getItem(LAST_VISIT_KEY);
    localStorage.setItem(LAST_VISIT_KEY, today);
    return last;
  } catch {
    return null;
  }
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
  return data as T;
}

const shop: Shop = {
  search: async (query, maxPrice) => (await post<{ products: Product[] }>('/api/shop', { action: 'search', query, maxPrice })).products,
  searchByPhoto: async (photo, maxPrice) => {
    const body = photo.startsWith('data:') ? { action: 'upload', base64: photo.slice(photo.indexOf(',') + 1), maxPrice } : { action: 'photo', imageUrl: photo, maxPrice };
    return (await post<{ products: Product[] }>('/api/shop', body)).products;
  },
  lookup: async (url) => (await post<{ product: Product | null }>('/api/shop', { action: 'lookup', url })).product,
  similar: async (productId, maxPrice) => (await post<{ products: Product[] }>('/api/shop', { action: 'similar', productId, maxPrice })).products,
  buy: (authorizationId, productId) => post('/api/holds/charge', { authorizationId, productId }),
  release: async (authorizationId) => {
    await post('/api/holds/release', { authorizationId });
  },
};

type Saved = { exchange: Exchange; feed: FeedItem[]; messages: ModelMessage[] };

function load(): Saved | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? (JSON.parse(text) as Saved) : null;
  } catch {
    return null;
  }
}

export class ExchangeStore {
  private exchange: Exchange;
  private feed: FeedItem[];
  private messages: ModelMessage[];
  private busy = false;
  private modelDown = false;
  private placing: string[] = [];
  private question: string | null = null;
  private error: string | null = null;
  private welcome: string | null = null;
  private answerQuestion: ((yes: boolean) => void) | null = null;
  private listeners = new Set<() => void>();
  private nextId = 1;
  private view: View;

  constructor() {
    const saved = load();
    this.exchange = saved?.exchange ?? demoExchange();
    const today = new Date().toISOString().slice(0, 10);
    const last = lastVisitDay(today);
    this.welcome = saved && last && last < today ? welcomeBack(this.exchange) : null;
    this.feed = saved?.feed ?? [];
    this.messages = saved?.messages ?? [];
    this.nextId = this.feed.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
    this.view = this.buildView();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getView = () => this.view;

  private buildView(): View {
    return { exchange: this.exchange, feed: this.feed, busy: this.busy, modelDown: this.modelDown, placing: this.placing, question: this.question, error: this.error, welcome: this.welcome };
  }

  private changed() {
    this.view = this.buildView();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ exchange: this.exchange, feed: this.feed, messages: this.messages }));
    } catch {
      // Private windows may refuse: the demo still works until the page closes.
    }
    this.listeners.forEach((listener) => listener());
  }

  private context: ToolContext = {
    get: () => this.exchange,
    set: (next) => {
      this.exchange = next;
      this.changed();
    },
    shop,
    confirm: (question) =>
      new Promise((resolve) => {
        this.question = question;
        this.answerQuestion = resolve;
        this.changed();
      }),
  };

  answer(yes: boolean) {
    this.answerQuestion?.(yes);
    this.answerQuestion = null;
    this.question = null;
    this.changed();
  }

  dismissWelcome() {
    this.welcome = null;
    this.changed();
  }

  clearError() {
    this.error = null;
    this.changed();
  }

  private pushFeed(item: Omit<Extract<FeedItem, { kind: 'you' | 'tinsel' }>, 'id'> | Omit<Extract<FeedItem, { kind: 'tool' }>, 'id'>) {
    const entry = { ...item, id: this.nextId++ } as FeedItem;
    this.feed = [...this.feed, entry];
    this.changed();
    return entry.id;
  }

  private updateFeed(id: number, change: Partial<Extract<FeedItem, { kind: 'tool' }>>) {
    this.feed = this.feed.map((item) => (item.id === id && item.kind === 'tool' ? { ...item, ...change } : item));
    this.changed();
  }

  private dropFeed(id: number) {
    this.feed = this.feed.filter((item) => item.id !== id);
    this.changed();
  }

  // ---------------- holds

  /** The demo's colleagues place their holds as soon as the page opens. Real sandbox authorizations. */
  async startColleagues() {
    const waiting = activePeople(this.exchange).filter((person) => !person.isYou && !this.exchange.holds[person.id] && !this.placing.includes(person.id));
    if (this.exchange.cancelled || waiting.length === 0) return;
    this.placing = [...this.placing, ...waiting.map((person) => person.id)];
    this.changed();
    await Promise.all(
      waiting.map(async (person, index) => {
        // One after another on screen, the way people would really turn up.
        await new Promise((resolve) => setTimeout(resolve, index * 350));
        try {
          // Nobody is there to click again for a colleague, so a bad moment at PayPal mustn't leave them waiting.
          await withRetries(() => this.placeTestCardHold(person), 3, 1500);
        } catch (cause) {
          this.error = (cause as Error).message;
        } finally {
          this.placing = this.placing.filter((id) => id !== person.id);
          this.changed();
        }
      }),
    );
  }

  private recordHold(person: Person, receipt: HoldReceipt, placedWith: Hold['placedWith']) {
    const hold: Hold = { orderId: receipt.orderId, authorizationId: receipt.authorizationId, held: receipt.held, status: 'HELD', expiresAt: receipt.expiresAt, placedWith };
    this.exchange = { ...this.exchange, holds: { ...this.exchange.holds, [person.id]: hold } };
    this.changed();
  }

  private async placeTestCardHold(person: Person) {
    const receipt = await post<HoldReceipt>('/api/holds', { personId: person.id, name: person.name, amount: this.exchange.budget, method: 'test-card' });
    this.recordHold(person, receipt, 'test-card');
  }

  async holdYoursWithTestCard() {
    const you = this.you();
    this.placing = [...this.placing, you.id];
    this.changed();
    try {
      await this.placeTestCardHold(you);
    } catch (cause) {
      this.error = (cause as Error).message;
    } finally {
      this.placing = this.placing.filter((id) => id !== you.id);
      this.changed();
    }
  }

  /** Starts the order PayPal's window will ask you to approve. */
  createYourOrder = () => {
    const you = this.you();
    return post<{ orderId: string }>('/api/holds', { personId: you.id, name: you.name, amount: this.exchange.budget, method: 'paypal' });
  };

  /** You approved in PayPal's window: places the hold. */
  async finishYourHold(orderId: string) {
    const receipt = await post<HoldReceipt>(`/api/holds/${orderId}/authorize`);
    this.recordHold(this.you(), receipt, 'paypal');
  }

  fail(message: string) {
    this.error = message;
    this.changed();
  }

  you(): Person {
    return this.exchange.people.find((person) => person.isYou)!;
  }

  updateYou(change: Partial<Person>) {
    this.exchange = { ...this.exchange, people: this.exchange.people.map((person) => (person.isYou ? { ...person, ...change } : person)) };
    this.changed();
  }

  lookup = (url: string) => shop.lookup(url);

  // ---------------- choosing and buying

  /** You chose your gift: it's bought straight away, at the exact price. */
  async chooseIdea(slot: string, productId: string) {
    this.exchange = { ...this.exchange, picks: { ...this.exchange.picks, [slot]: { productId, by: 'giver' } } };
    this.changed();
    await this.runTool('buyGift', { slot });
    this.announceIfDone();
  }

  /** You'd rather not choose: the assistant's first idea is its best. */
  async letTinselChoose(slot: string) {
    const first = this.exchange.ideas[slot]?.[0];
    if (!first) return;
    this.exchange = { ...this.exchange, picks: { ...this.exchange.picks, [slot]: { productId: first.product.id, by: 'tinsel', why: 'You asked me to choose, and this is the one I ranked first.' } } };
    this.changed();
    await this.runTool('buyGift', { slot });
    this.announceIfDone();
  }

  async moreLikeThis(slot: string, product: Product) {
    const id = this.pushFeed({ kind: 'tool', status: `Finding more like ${product.title}`, state: 'running' });
    try {
      const similar = (await shop.similar(product.id, this.exchange.budget)).slice(0, 3);
      if (similar.length === 0) {
        this.updateFeed(id, { state: 'failed', note: 'Nothing similar under the budget right now.' });
        return;
      }
      const ideas = similar.map((found) => ({ product: found, reason: `Like the ${product.title}, and under the budget too.` }));
      this.exchange = {
        ...this.exchange,
        ideas: { ...this.exchange.ideas, [slot]: ideas },
        candidates: { ...this.exchange.candidates, [slot]: [...(this.exchange.candidates[slot] ?? []), ...similar] },
      };
      this.updateFeed(id, { state: 'done', note: `${similar.length} similar under ${money(this.exchange.budget)}` });
    } catch (cause) {
      this.updateFeed(id, { state: 'failed', note: (cause as Error).message });
    }
  }

  private announceIfDone() {
    if (stageOf(this.exchange) !== 'reveal') return;
    const { held, charged, released } = totals(this.exchange);
    this.pushFeed({ kind: 'tinsel', text: `All the gifts are bought. ${money(held)} was held, ${money(charged)} was charged, and ${money(released)} went straight back to people's accounts.` });
  }

  /** Opens the gifts, and asks for cut-out pictures to make them look their best. */
  async reveal() {
    this.exchange = { ...this.exchange, revealed: true };
    this.changed();
    await Promise.all(
      slotList(this.exchange).map(async (slot) => {
        const purchase = this.exchange.bought[slot];
        if (!purchase) return;
        const { sticker } = await post<{ sticker: string | null }>('/api/shop', { action: 'sticker', productId: purchase.product.id }).catch(() => ({ sticker: null }));
        if (sticker) {
          this.exchange = { ...this.exchange, bought: { ...this.exchange.bought, [slot]: { ...this.exchange.bought[slot], sticker } } };
          this.changed();
        }
      }),
    );
  }

  yourSlot() {
    return slotOfGiver(this.exchange, this.you().id);
  }

  /** Everyone else has bought their gift, and the assistant can't choose yours unless you ask. */
  onlyYourChoiceLeft() {
    const yours = this.yourSlot();
    return Boolean(yours) && slotList(this.exchange).every((slot) => slot === yours || this.exchange.bought[slot]) && Boolean(this.exchange.ideas[yours!]?.length);
  }

  decider(slot: string) {
    return deciderOf(this.exchange, slot);
  }

  // ---------------- the assistant

  private async runTool(name: string, args: Record<string, unknown>): Promise<Outcome> {
    const tool = TOOLS[name];
    const id = this.pushFeed({ kind: 'tool', status: tool?.status ?? name, state: 'running' });
    if (!tool) {
      this.updateFeed(id, { state: 'failed', note: 'No such tool.' });
      return { reply: `There is no tool called ${name}.`, failed: true };
    }
    let outcome: Outcome;
    try {
      outcome = await tool.run(args, this.context);
    } catch (cause) {
      outcome = { reply: `That didn't work: ${(cause as Error).message}`, failed: true, note: (cause as Error).message };
    }
    if (outcome.quiet) this.dropFeed(id);
    else this.updateFeed(id, { state: outcome.failed ? 'failed' : 'done', note: outcome.note });
    return outcome;
  }

  /** One request to the assistant: it keeps calling tools until it has something to say. */
  async ask(prompt: string) {
    if (this.busy) return;
    this.busy = true;
    this.pushFeed({ kind: 'you', text: prompt });
    this.messages = [...this.messages, { role: 'user', content: prompt }];
    let buying = prompt.trim().toLowerCase() === 'buy the gifts';
    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const answer = await post<{ id?: string; choices?: { message?: ModelMessage }[] }>('/api/ai', { messages: this.messages });
        const message = answer.choices?.[0]?.message;
        if (!message) throw new Error('The assistant had nothing to say.');
        if (answer.id === 'tinsel-notice') this.modelDown = true;
        else this.messages = [...this.messages, { role: 'assistant', content: message.content ?? null, ...(message.tool_calls?.length ? { tool_calls: message.tool_calls } : {}) }];
        const calls = message.tool_calls ?? [];
        // A closing line from a run that stopped short would be out of date once the run is finished for it.
        if (message.content && !(calls.length === 0 && !this.modelDown && isUnfinished(this.exchange, buying))) this.pushFeed({ kind: 'tinsel', text: message.content });
        if (calls.length === 0) break;
        if (calls.some((call) => call.function.name === 'buyGift')) buying = true;

        const results = await Promise.all(
          calls.map(async (call) => {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(call.function.arguments || '{}');
            } catch {
              return { role: 'tool', tool_call_id: call.id, content: 'Those arguments were not valid JSON.' };
            }
            const outcome = await this.runTool(call.function.name, args);
            return { role: 'tool', tool_call_id: call.id, content: outcome.reply };
          }),
        );
        this.messages = [...this.messages, ...results];
      }
      if (!this.modelDown && isUnfinished(this.exchange, buying)) await this.finishForTheAssistant(buying);
    } catch (cause) {
      this.pushFeed({ kind: 'tinsel', text: `Something went wrong on my side: ${(cause as Error).message}` });
    } finally {
      this.busy = false;
      this.changed();
      this.announceIfDone();
    }
  }

  private async finishForTheAssistant(buying: boolean) {
    await finishRun(this.context, (name, run) => this.runToolScripted(name, run), buying);
    const line = afterFinishing(this.exchange);
    if (!line) return;
    this.pushFeed({ kind: 'tinsel', text: line });
    this.messages = [...this.messages, { role: 'assistant', content: line }];
  }

  /** Runs what it can with the same tools and no model. */
  async runWithoutModel() {
    if (this.busy) return;
    this.busy = true;
    this.pushFeed({ kind: 'you', text: 'Run the exchange without the assistant' });
    try {
      await runScripted(this.context, (name, run) => this.runToolScripted(name, run));
      const yourSlot = this.yourSlot();
      if (yourSlot && !this.exchange.bought[yourSlot]) this.pushFeed({ kind: 'tinsel', text: 'Everyone else is done. Your ideas are ready to choose from.' });
    } finally {
      this.busy = false;
      this.changed();
      this.announceIfDone();
    }
  }

  private async runToolScripted(name: string, run: () => Promise<Outcome> | Outcome): Promise<Outcome> {
    const id = this.pushFeed({ kind: 'tool', status: TOOLS[name]?.status ?? name, state: 'running' });
    let outcome: Outcome;
    try {
      outcome = await run();
    } catch (cause) {
      outcome = { reply: (cause as Error).message, failed: true, note: (cause as Error).message };
    }
    this.updateFeed(id, { state: outcome.failed ? 'failed' : 'done', note: outcome.note });
    return outcome;
  }

  // ---------------- starting over

  /** Gives back every hold still in place, then starts a new exchange. */
  async startOver() {
    const live = Object.values(this.exchange.holds).filter((hold) => hold.status === 'HELD');
    await Promise.all(live.map((hold) => shop.release(hold.authorizationId).catch(() => undefined)));
    this.exchange = demoExchange();
    this.feed = [];
    this.messages = [];
    this.modelDown = false;
    this.error = null;
    this.changed();
    await this.startColleagues();
  }
}
