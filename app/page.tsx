import Link from 'next/link';
import { Logo } from '@/components/logo';
import { HeroVideo } from '@/components/hero-video';
import { ArrowIcon, BagIcon, EyeOffIcon, GiftIcon, ReceiptIcon, ShieldIcon, ShuffleIcon, TagIcon, WalletIcon } from '@/components/icons';
import { Reveal } from '@/components/reveal';

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
  ['PayPal Orders and Payments', 'Authorize, capture the exact price, void. Through the PayPal Server SDK.'],
  ['PayPal JavaScript SDK v6', "The button that opens PayPal's window to approve your hold."],
  ['Channel3', 'Search, photo search, wishlist links, similar products, a price check before buying, and cut-out pictures for the reveal.'],
  ['OpenAI', 'The model behind the assistant, through a server proxy that holds the key and fixes its tools.'],
];

const SNOW = Array.from({ length: 18 }, (_, i) => i);

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-[var(--line)]/70 bg-[var(--cream)]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
          <Logo className="size-8" />
          <span className="font-display text-2xl font-semibold tracking-tight">Tinsel</span>
          <a href="#how" className="ml-auto hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] sm:block">
            How it goes
          </a>
          <a href="#limits" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] sm:block">
            Why it&rsquo;s safe
          </a>
          <Link href="/exchange" className="ml-auto rounded-lg bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-dark)] sm:ml-2">
            Start the demo
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="festive-hero relative overflow-hidden">
          <span className="snow" aria-hidden>
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
              <circle cx="120" cy="88" r="20" fill="var(--pine)" />
              <circle cx="113" cy="81" r="5" fill="#fff" fillOpacity=".25" />
            </g>
            <g className="swing" style={{ transformOrigin: '182px 0' }}>
              <path d="M182 0v158" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="176" y="156" width="12" height="9" rx="2" fill="var(--gold)" />
              <circle cx="182" cy="184" r="19" fill="var(--gold)" />
              <path d="M165 182c5 4 11 5 17 5s12-1 17-5" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </svg>

          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3.5 py-1.5 text-xs font-semibold shadow-sm">
              <span className="size-2 rounded-full bg-[var(--berry)]" aria-hidden />
              Budgets held on PayPal · gifts from real stores
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              The gift exchange that <em className="text-[var(--berry)]">runs itself.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              Tinsel draws the names, finds each person the right gift and buys it. PayPal holds everyone&rsquo;s budget, so the assistant can&rsquo;t
              overspend, and only the exact price is charged. The rest goes straight back.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/exchange"
                className="group inline-flex items-center gap-2 rounded-xl bg-[var(--pine)] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[var(--pine)]/25 transition hover:-translate-y-0.5 hover:bg-[var(--pine-dark)]"
              >
                Start the demo exchange
                <ArrowIcon className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a href="#limits" className="rounded-xl border border-[var(--line-strong)] bg-white px-6 py-3.5 font-semibold transition hover:-translate-y-0.5">
                Why it can&rsquo;t overspend
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">PayPal sandbox: no real money moves, no parcel ships, and the team is fictional.</p>

            <div className="relative mt-14">
              <Link href="/exchange" className="browser-frame block" aria-label="Start the demo exchange">
                <span className="browser-bar" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <span className="browser-url">tinsel-nine.vercel.app/exchange</span>
                </span>
                <HeroVideo />
              </Link>
              <div className="float-chip float-a left-[-2.5rem] top-20" aria-hidden>
                <span className="chip-icon bg-[#fbf0d3] text-[#7c5a0c]">$</span>
                <span>
                  <b>$30.00 held on PayPal</b>
                  <br />
                  Reserved, not charged
                </span>
              </div>
              <div className="float-chip float-b right-[-2.5rem] top-[38%]" aria-hidden>
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

        {/* The problem */}
        <section className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-2">
            <Reveal>
              <p className="font-display text-6xl font-semibold tracking-tight text-[var(--berry)]">2.5 million</p>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">unwanted Secret Santa gifts go straight in the bin every year in the UK alone, according to a survey by Love2shop (2024).</p>
            </Reveal>
            <Reveal delay={100}>
              <p className="font-display text-6xl font-semibold tracking-tight text-[var(--berry)]">1 in 6</p>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">
                people say the presents they&rsquo;re most likely to throw away come from workmates, the top category in a HIPPO survey of 2,000 UK adults (November 2025).
              </p>
            </Reveal>
          </div>
        </section>

        {/* How it goes */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--berry)]">How it goes</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">From the draw to the gift, without chasing anyone.</h2>
          </Reveal>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 90}>
                <li className="card-lift h-full rounded-2xl border border-[var(--line)] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-[var(--wash)] text-[var(--pine)]">
                      <step.icon className="size-5" />
                    </span>
                    <span className="font-display text-4xl font-semibold text-[var(--line-strong)]">{index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* The money, step by step */}
        <section className="bg-[var(--wash)]/60 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--berry)]">The money</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Held, charged to the cent, and the rest given back.</h2>
              <p className="mt-5 leading-relaxed text-[var(--muted)]">
                A PayPal authorization works like a hotel deposit. Tinsel captures only what the chosen gift costs, at the price Channel3 gives right
                then, and the capture releases the rest. Drop out, and the whole hold goes back.
              </p>
              <Link href="/exchange" className="mt-7 inline-flex items-center gap-2 font-semibold text-[var(--pine)] hover:underline">
                Watch it happen in the PayPal ledger
                <ArrowIcon className="size-4" />
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <div className="receipt mx-auto max-w-sm rounded-2xl bg-white p-7 shadow-xl shadow-[var(--pine)]/10" aria-label="An example: $30.00 held, $24.95 charged, $5.05 released">
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
            </Reveal>
          </div>
        </section>

        {/* Limits */}
        <section id="limits" className="scroll-mt-16 bg-[var(--pine)] text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">An assistant that spends money should have limits you can check.</h2>
            </Reveal>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {LIMITS.map((limit, i) => (
                <Reveal key={limit.title} delay={i * 110}>
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#f3d58a]">
                    <limit.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-semibold">{limit.title}</h3>
                  <p className="mt-2 leading-relaxed text-white/80">{limit.text}</p>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-12">
              <p className="text-sm text-white/70">Try to break it in the demo:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Who drew me?', 'Ben can’t make it this year'].map((prompt) => (
                  <span key={prompt} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm">
                    &ldquo;{prompt}&rdquo;
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Built with */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Built with</h2>
            <dl className="mt-8 grid gap-4 md:grid-cols-2">
              {STACK.map(([name, role]) => (
                <div key={name} className="card-lift rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{role}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* Closing call */}
        <section className="px-6 pb-20">
          <Reveal>
            <div className="festive-cta relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white">
              <span className="snow" aria-hidden>
                {SNOW.slice(0, 12).map((i) => (
                  <i key={i} />
                ))}
              </span>
              <h2 className="relative mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">This year, nobody gets a seventh mug.</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/80">Run Fernhill Studio&rsquo;s exchange from the draw to the gifts. It takes a couple of minutes.</p>
              <Link
                href="/exchange"
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-[var(--pine)] transition hover:-translate-y-0.5"
              >
                Start the demo exchange
                <ArrowIcon className="size-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <Logo className="size-5" />
            A demo built for the PayPal AI Hackathon. Fernhill Studio and its team are fictional.
          </span>
          <a href="https://github.com/Arnaud-TOE/tinsel" className="font-semibold text-[var(--pine)] hover:underline">
            Source on GitHub, MIT license
          </a>
        </div>
      </footer>
    </div>
  );
}
