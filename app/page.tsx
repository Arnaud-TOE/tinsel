import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const STEPS = [
  { title: 'Everyone holds their budget', text: 'Each person approves a hold on PayPal. The money is reserved, not charged, and nobody has to chase anybody.' },
  { title: 'Tinsel draws the names', text: 'In code, at random, with your rules: nobody draws themselves, and couples can be kept apart. Not even the assistant knows who has whom.' },
  { title: 'It shops from real stores', text: 'Search, wishlist links and photos, across 100M+ products from Channel3. In stock, under budget, with a reason for each idea.' },
  { title: 'Only the exact price is charged', text: 'Choose a gift or let Tinsel choose. It checks the price again, takes that much from your hold, and the rest is released on the spot.' },
];

const LIMITS = [
  {
    title: "It can't see the draw",
    text: 'The model only ever gets numbered slots and anonymous tastes. Ask it who drew you and it can only say it doesn’t know.',
  },
  {
    title: "It can't overspend",
    text: 'The hold is the ceiling, and PayPal enforces it, not a promise from a model. Ask for more than was held and PayPal refuses the capture.',
  },
  {
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

export default function Home() {
  return (
    <div className="min-h-dvh">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-5">
        <Logo className="size-8" />
        <span className="font-display text-2xl font-semibold tracking-tight">Tinsel</span>
        <Link href="/exchange" className="ml-auto rounded-lg bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-dark)]">
          Start the demo
        </Link>
      </nav>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-8 md:pt-14">
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl">The gift exchange that runs itself.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            Tinsel draws the names, finds each person the right gift and buys it. PayPal holds everyone&rsquo;s budget, so the assistant can&rsquo;t overspend, and only the exact price is charged. The rest goes straight back.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/exchange" className="rounded-lg bg-[var(--pine)] px-5 py-3 font-semibold text-white hover:bg-[var(--pine-dark)]">
              Start the demo exchange
            </Link>
            <p className="text-sm text-[var(--muted)]">PayPal sandbox: no real money moves, no parcel ships, and the team is fictional.</p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--line)] shadow-xl">
            <Image src="/app.png" alt="An exchange in progress: a team of six with budgets held on PayPal, three real gift ideas with reasons, and the assistant's activity" width={2880} height={1620} priority className="h-auto w-full" />
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-2">
            <div>
              <p className="font-display text-5xl font-semibold tracking-tight text-[var(--berry)]">2.5 million</p>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">unwanted Secret Santa gifts go straight in the bin every year in the UK alone, according to a survey by Love2shop (2024).</p>
            </div>
            <div>
              <p className="font-display text-5xl font-semibold tracking-tight text-[var(--berry)]">1 in 6</p>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">people say the presents they&rsquo;re most likely to throw away come from workmates, the top category in a HIPPO survey of 2,000 UK adults (November 2025).</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl font-semibold tracking-tight">How it goes</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <span className="grid size-8 place-items-center rounded-full bg-[var(--berry)] text-sm font-semibold text-white">{index + 1}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-[var(--pine)] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-display text-4xl font-semibold tracking-tight">An assistant that spends money should have limits you can check.</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {LIMITS.map((limit) => (
                <div key={limit.title}>
                  <h3 className="font-display text-xl font-semibold">{limit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-90">{limit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl font-semibold tracking-tight">Built with</h2>
          <dl className="mt-8 grid gap-5 md:grid-cols-2">
            {STACK.map(([name, role]) => (
              <div key={name}>
                <dt className="font-semibold">{name}</dt>
                <dd className="text-[var(--muted)]">{role}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <p className="mx-auto max-w-6xl px-6 py-6 text-sm text-[var(--muted)]">Tinsel is a demo built for the PayPal AI Hackathon. Open source under the MIT licence. Fernhill Studio and its team are fictional.</p>
      </footer>
    </div>
  );
}
