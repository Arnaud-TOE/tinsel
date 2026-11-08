// Keeps a public demo honest about what it spends. Counters live in memory, per server instance: they
// stop a runaway tab or a casual script, and the prepaid accounts behind them are the hard ceiling.

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** A sliding-window counter: `hit` says whether one more call fits. */
export class CallLimiter {
  private calls = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now = Date.now()): boolean {
    const recent = (this.calls.get(key) ?? []).filter((at) => now - at < this.windowMs);
    const allowed = recent.length < this.limit;
    if (allowed) recent.push(now);
    this.calls.set(key, recent);
    if (this.calls.size > 5000) {
      for (const [k, times] of this.calls) if (times.every((at) => now - at >= this.windowMs)) this.calls.delete(k);
    }
    return allowed;
  }
}

const visitorOf = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

// The demo runs on a small prepaid budget. A full run and a few questions take about 35 model calls: a
// visitor can do that in ten minutes, and the day allows about four. Without the model, the run still works.
const modelPerVisitor = new CallLimiter(Number(process.env.AI_CALLS_PER_VISITOR) || 70, 10 * MINUTE);
const modelPerDay = new CallLimiter(Number(process.env.AI_CALLS_PER_DAY) || 140, DAY);

export function modelCallRefusal(request: Request): string | null {
  if (!modelPerVisitor.hit(visitorOf(request))) return 'This demo limits how much one visitor can ask me in ten minutes. Please try again in a few minutes.';
  if (!modelPerDay.hit('all')) return "The demo's AI budget for today is used up. You can still run the exchange without me, with the button below.";
  return null;
}

// Channel3 bills a credit per search, photo search, lookup, similar or sticker call, and a full run takes about
// 25. The day's cap is far above what the judges need, and keeps a runaway tab or a script from spending the rest.
const shopPerVisitor = new CallLimiter(Number(process.env.SHOP_CALLS_PER_VISITOR) || 150, 10 * MINUTE);
const shopPerDay = new CallLimiter(Number(process.env.SHOP_CALLS_PER_DAY) || 1200, DAY);

export function shopCallRefusal(request: Request): string | null {
  if (!shopPerVisitor.hit(visitorOf(request))) return 'That was a lot of searching for one visitor. Please try again in a few minutes.';
  if (!shopPerDay.hit('all')) return "The demo's shopping budget for today is used up. Please come back tomorrow.";
  return null;
}

const holdsPerDay = new CallLimiter(Number(process.env.HOLDS_PER_DAY) || 600, DAY);

export const holdAllowed = () => holdsPerDay.hit('all');

/** Whether the request comes from a page of this site. Browsers always send Origin on a POST. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
