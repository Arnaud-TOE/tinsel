import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Logo } from '@/components/logo';
import { HeroVideo } from '@/components/hero-video';
import { CountUp, Marquee, Spot } from '@/components/fx';
import { ArrowIcon, BagIcon, EyeOffIcon, GiftIcon, ReceiptIcon, ShieldIcon, ShuffleIcon, TagIcon, WalletIcon } from '@/components/icons';
import { Reveal } from '@/components/reveal';

// The front door, as a winter night in Tinsel's pine, berry and gold (app/fx.css).
const NIGHT = {
  '--night': '#05130b',
  '--glow-a': '#e0b04a',
  '--glow-b': '#e0323d',
  '--glow-c': '#2f9e5b',
} as CSSProperties;

const STEPS = [
  { icon: WalletIcon, title: 'Everyone holds their budget', text: 'Each person approves a hold on PayPal. The money is reserved, not charged, and nobody has to chase anybody.' },
  { icon: ShuffleIcon, title: 'Tinsel draws the names', text: 'In code, at random, with your rules: nobody draws themselves, and couples can be kept apart. Not even the assistant knows who has whom.' },
  { icon: BagIcon, title: 'It shops from real stores', text: 'Search, wishlist links and photos, across 100M+ products from Channel3. In stock, under budget, with a reason for each idea.' },
  { icon: ReceiptIcon, title: 'Only the exact price is charged', text: 'Choose a gift or let Tinsel choose. It checks the price again, takes that much from your hold, and the rest is released on the spot.' },
];

const LIMITS = [
  {
    icon: EyeOffIcon,
    title: "It can't see the draw",
    text: 'The model only ever gets numbered slots and anonymous tastes. Ask it who drew you and it can only say it doesn’t know.',
  },
  {
    icon: ShieldIcon,
    title: "It can't overspend",
    text: 'The hold is the ceiling, and PayPal enforces it, not a promise from a model. Ask for more than was held and PayPal refuses the capture.',
  },
  {
    icon: TagIcon,
    title: "It can't make up a gift",
    text: 'It can only propose what a search returned, and only buy what someone chose. The server takes the price from Channel3 at that moment.',
  },
];

const STACK = [
  'PayPal Orders v2 · AUTHORIZE',
  'PayPal Payments v2 · capture and void',
  'PayPal JavaScript SDK v6',
  'PayPal Server SDK by APIMatic',
  'Channel3 search',
  'Channel3 image search',
  'Channel3 lookup and similar',
  'Channel3 stickers',
  'OpenAI GPT-5.4 mini',
  'Next.js 16',
];

const SNOW = Array.from({ length: 18 }, (_, i) => i);

export default function Home() {
  return (
    <div className="night min-h-dvh" style={NIGHT}>
      <header className="sticky top-0 z-40 border-b hairline bg-[#05130b]/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
          <Logo className="size-8" />
          <span className="font-display text-2xl font-semibold tracking-tight">Tinsel</span>
          <a href="#how" className="ml-auto hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/60 transition hover:text-white sm:block">
            How it goes
          </a>
          <a href="#money" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/60 transition hover:text-white md:block">
            The money
          </a>
          <a href="#limits" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/60 transition hover:text-white sm:block">
            Why it&rsquo;s safe
          </a>
          <Link href="/exchange" className="btn-glow ml-auto rounded-full px-4 py-2 text-sm font-bold sm:ml-2">
            Start the demo
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="grain relative overflow-hidden">
          <div className="aurora" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="grid-lines" aria-hidden />
          <span className="snow snow-night" aria-hidden>
            {SNOW.map((i) => (
              <i key={i} />
            ))}
          </span>
          <svg className="baubles" viewBox="0 0 220 260" aria-hidden>
            <g className="swing" style={{ transformOrigin: '50px 0' }}>
              <path d="M50 0v118" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="43" y="116" width="14" height="10" rx="2" fill="var(--gold)" />
              <circle cx="50" cy="150" r="26" fill="var(--berry)" />
              <path d="M28 144c7 5 14 7 22 7s15-2 22-7" stroke="#fff" strokeOpacity=".6" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
            <g className="swing swing-late" style={{ transformOrigin: '120px 0' }}>
              <path d="M120 0v62" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="114" y="60" width="12" height="9" rx="2" fill="var(--gold)" />
              <circle cx="120" cy="88" r="20" fill="#2f9e5b" />
              <circle cx="113" cy="81" r="5" fill="#fff" fillOpacity=".3" />
            </g>
            <g className="swing" style={{ transformOrigin: '182px 0' }}>
              <path d="M182 0v158" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="176" y="156" width="12" height="9" rx="2" fill="var(--gold)" />
              <circle cx="182" cy="184" r="19" fill="var(--gold)" />
              <path d="M165 182c5 4 11 5 17 5s12-1 17-5" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </svg>

          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 md:pt-24">
            <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <span className="size-2 rounded-full bg-[#e0323d] shadow-[0_0_10px] shadow-[#e0323d]" aria-hidden />
              Budgets held on PayPal · gifts from real stores
            </p>
            <h1 className="text-balance mt-7 max-w-4xl font-display text-6xl font-semibold leading-[0.95] tracking-[-0.03em] md:text-8xl">
              The gift exchange that <em className="shimmer-text pr-2">runs itself.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
              Tinsel draws the names, finds each person the right gift and buys it. PayPal holds everyone&rsquo;s budget, so the assistant can&rsquo;t overspend,
              and only the exact price is charged. The rest goes straight back.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/exchange" className="btn-glow group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold">
                Start the demo exchange
                <ArrowIcon className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a href="#limits" className="btn-ghost rounded-full px-7 py-3.5 font-bold">
                Why it can&rsquo;t overspend
              </a>
            </div>
            <p className="mt-4 text-xs text-white/45">PayPal sandbox: no real money moves, no parcel ships, and the team is fictional.</p>

            <div className="relative mt-16">
              <div className="glow-under" aria-hidden />
              <div className="tilt-in">
                <Link href="/exchange" className="beam block overflow-hidden rounded-[1.4rem] p-1.5" aria-label="Start the demo exchange">
                  <span className="block overflow-hidden rounded-[1.05rem] bg-white">
                    <span className="browser-bar" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <span className="browser-url">tinsel-nine.vercel.app/exchange</span>
                    </span>
                    <HeroVideo />
                  </span>
                </Link>
              </div>
              <div className="float-chip float-a left-[-3rem] top-20" aria-hidden>
                <span className="chip-icon bg-[#fbf0d3] text-[#7c5a0c]">$</span>
                <span>
                  <b>$30.00 held on PayPal</b>
                  <br />
                  Reserved, not charged
                </span>
              </div>
              <div className="float-chip float-b right-[-3rem] top-[38%]" aria-hidden>
                <span className="chip-icon bg-[#dcefe2] text-[var(--pine)]">✓</span>
                <span>
                  <b>Charged $24.95</b>
                  <br />
                  $5.05 released on the spot
                </span>
              </div>
              <div className="float-chip float-c bottom-12 left-[10%]" aria-hidden>
                <span className="chip-icon bg-[var(--wash)] text-[var(--berry)]">?</span>
                <span>
                  <b>&ldquo;Who drew me?&rdquo;</b>
                  <br />
                  &ldquo;I can&rsquo;t know. I only see slots.&rdquo;
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y hairline py-7">
          <Marquee items={STACK} />
        </section>

        {/* The problem */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e0b04a]">The problem</p>
            <h2 className="text-balance mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">Drawing names is solved. Nobody solved the rest.</h2>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <Reveal>
              <Spot className="glass h-full rounded-3xl p-8">
                <p className="font-display text-7xl font-semibold tracking-tight">
                  <CountUp to={2.5} decimals={1} suffix=" million" />
                </p>
                <p className="mt-4 leading-relaxed text-white/60">unwanted Secret Santa gifts go straight in the bin every year in the UK alone, according to a survey by Love2shop (2024).</p>
              </Spot>
            </Reveal>
            <Reveal delay={100}>
              <Spot className="glass h-full rounded-3xl p-8">
                <p className="font-display text-7xl font-semibold tracking-tight">1 in 6</p>
                <p className="mt-4 leading-relaxed text-white/60">
                  people say the presents they&rsquo;re most likely to throw away come from workmates, the top category in a HIPPO survey of 2,000 UK adults (November
                  2025).
                </p>
              </Spot>
            </Reveal>
          </div>
        </section>

        {/* How it goes */}
        <section id="how" className="relative scroll-mt-20 overflow-hidden border-y hairline py-24">
          <div className="aurora opacity-50" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e0b04a]">How it goes</p>
              <h2 className="text-balance mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-6xl">From the draw to the gift, without chasing anyone.</h2>
            </Reveal>
            <div role="list" className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 90}>
                  <Spot className="glass h-full rounded-3xl p-6">
                    <div role="listitem">
                      <div className="flex items-center justify-between">
                        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#e0b04a]/30 to-[#e0323d]/20 text-[#f3d58a] ring-1 ring-white/15">
                          <step.icon className="size-5" />
                        </span>
                        <span className="font-display text-5xl font-semibold text-white/10">{index + 1}</span>
                      </div>
                      <h3 className="mt-6 font-display text-2xl font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">{step.text}</p>
                    </div>
                  </Spot>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* The money, step by step */}
        <section id="money" className="scroll-mt-20 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e0b04a]">The money</p>
              <h2 className="text-balance mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">Held, charged to the cent, and the rest given back.</h2>
              <p className="mt-6 leading-relaxed text-white/65">
                A PayPal authorization works like a hotel deposit. Tinsel captures only what the chosen gift costs, at the price Channel3 gives right then, and the capture
                releases the rest. Drop out, and the whole hold goes back.
              </p>
              <Link href="/exchange" className="mt-8 inline-flex items-center gap-2 font-semibold text-[#f3d58a] hover:underline">
                Watch it happen in the PayPal ledger
                <ArrowIcon className="size-4" />
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <div className="relative mx-auto max-w-sm">
                <div className="glow-under" aria-hidden />
                <div className="receipt rotate-[-2deg] rounded-2xl bg-[#fbf7ef] p-7 text-[var(--ink)] shadow-2xl transition hover:rotate-0" aria-label="An example: $30.00 held, $24.95 charged, $5.05 released">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--berry)] text-white">
                      <GiftIcon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">Maya&rsquo;s gift</p>
                      <p className="text-xs text-[var(--muted)]">A matcha starter kit</p>
                    </div>
                  </div>
                  <dl className="mt-6 space-y-4 text-sm">
                    <div>
                      <div className="flex justify-between">
                        <dt className="text-[var(--muted)]">Held on PayPal</dt>
                        <dd className="font-semibold">$30.00</dd>
                      </div>
                      <span className="mt-1.5 block h-2 rounded-full bg-[#f3e2b3]" />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <dt className="text-[var(--muted)]">Charged, the exact price</dt>
                        <dd className="font-semibold text-[var(--pine)]">$24.95</dd>
                      </div>
                      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[var(--wash)]">
                        <span className="grow-bar block h-full rounded-full bg-[var(--pine)]" style={{ width: '83.2%' }} />
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-[var(--line-strong)] pt-4">
                      <dt className="text-[var(--muted)]">Released on the spot</dt>
                      <dd className="font-semibold text-[var(--berry)]">$5.05</dd>
                    </div>
                  </dl>
                  <p className="mt-6 rounded-xl bg-[var(--wash)] px-3 py-2 text-xs text-[var(--muted)]">A capture above the hold? PayPal answers MAX_CAPTURE_AMOUNT_EXCEEDED.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Limits */}
        <section id="limits" className="scroll-mt-16 border-y hairline bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <h2 className="text-balance max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl">An assistant that spends money should have limits you can check.</h2>
            </Reveal>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {LIMITS.map((limit, i) => (
                <Reveal key={limit.title} delay={i * 110}>
                  <Spot className="glass h-full rounded-3xl p-7">
                    <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#e0b04a]/30 to-[#2f9e5b]/25 text-[#f3d58a] ring-1 ring-white/15">
                      <limit.icon className="size-6" />
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-semibold">{limit.title}</h3>
                    <p className="mt-2 leading-relaxed text-white/60">{limit.text}</p>
                  </Spot>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-12">
              <p className="text-sm text-white/55">Try to break it in the demo:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Who drew me?', 'Ben can’t make it this year'].map((prompt) => (
                  <span key={prompt} className="glass rounded-full px-4 py-2 text-sm">
                    &ldquo;{prompt}&rdquo;
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Closing call */}
        <section className="px-6 py-24">
          <Reveal>
            <div className="beam relative mx-auto max-w-6xl overflow-hidden rounded-[2.2rem]" style={{ '--beam-fill': '#08200f' } as CSSProperties}>
              <div className="aurora" aria-hidden>
                <i />
                <i />
                <i />
              </div>
              <span className="snow snow-night" aria-hidden>
                {SNOW.slice(0, 12).map((i) => (
                  <i key={i} />
                ))}
              </span>
              <div className="relative px-8 py-20 text-center">
                <h2 className="text-balance mx-auto max-w-3xl font-display text-5xl font-semibold tracking-tight md:text-6xl">This year, nobody gets a seventh mug.</h2>
                <p className="mx-auto mt-5 max-w-xl text-white/65">Run Fernhill Studio&rsquo;s exchange from the draw to the gifts. It takes a couple of minutes.</p>
                <Link href="/exchange" className="btn-glow mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold">
                  Start the demo exchange
                  <ArrowIcon className="size-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="overflow-hidden border-t hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pt-10 text-sm text-white/50">
          <span className="flex items-center gap-2">
            <Logo className="size-5" />
            A demo built for the PayPal AI Hackathon. Fernhill Studio and its team are fictional.
          </span>
          <a href="https://github.com/Arnaud-TOE/tinsel" className="font-semibold text-[#f3d58a] hover:underline">
            Source on GitHub, MIT license
          </a>
        </div>
        <p className="wordmark mx-auto max-w-6xl px-6 pt-6 font-display text-[24vw] sm:text-[14rem]" aria-hidden>
          Tinsel
        </p>
      </footer>
    </div>
  );
}
