'use client';

import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/logo';
import type { Stage } from '@/lib/exchange/types';
import type { ExchangeStore, View } from './store';

export function suggestionsFor(stage: Stage): string[] {
  switch (stage) {
    case 'holds':
      return ['Who are we waiting for?'];
    case 'draw':
      return ['Run the exchange'];
    case 'ideas':
      return ['Find the ideas'];
    case 'picks':
      return ['Who drew me?', "Ben can't make it this year"];
    case 'buy':
      return ['Buy the gifts'];
    case 'reveal':
    case 'revealed':
      return ['How much did everyone save?'];
    default:
      return [];
  }
}

export function AssistantPanel({ store, view, stage }: { store: ExchangeStore; view: View; stage: Stage }) {
  const { feed, busy, modelDown } = view;
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [feed.length, busy]);

  const send = (prompt: string) => {
    if (!prompt.trim() || busy) return;
    setText('');
    void store.ask(prompt.trim());
  };

  const suggestions = suggestionsFor(stage);

  return (
    <aside className="assistant-panel app-panel flex h-[40dvh] shrink-0 flex-col bg-white lg:h-auto lg:w-[23rem]" aria-label="Tinsel, your assistant">
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <Logo className="size-5" />
        <h2 className="font-display text-lg font-semibold">Tinsel</h2>
        {busy && <span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)]"><span className="working-dot" aria-hidden />working</span>}
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {feed.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--muted)]">
            <span className="assistant-orb mx-auto grid size-16 place-items-center rounded-full" aria-hidden>
              <Logo className="size-8" />
            </span>
            <p className="mt-5 font-display text-lg font-semibold text-[var(--ink)]">Your exchange, run for you</p>
            <p className="mt-2">I run your gift exchange from start to finish: the draw, the shopping and the buying.</p>
            <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-xs">
              <li className="flex gap-2 rounded-lg bg-[var(--wash)] px-3 py-2"><span aria-hidden>🔒</span>I can&rsquo;t see who drew whom.</li>
              <li className="flex gap-2 rounded-lg bg-[var(--wash)] px-3 py-2"><span aria-hidden>💳</span>I can&rsquo;t spend more than PayPal is holding.</li>
            </ul>
          </div>
        )}
        {feed.map((item) => {
          if (item.kind !== 'tool') {
            return item.kind === 'you' ? (
              <p key={item.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--pine)] px-3 py-2 text-sm text-white">
                {item.text}
              </p>
            ) : (
              <p key={item.id} className="w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-[var(--wash)] px-3 py-2 text-sm leading-5">
                {item.text}
              </p>
            );
          }
          return (
            <div key={item.id} className={`tool-line tool-${item.state} text-xs`}>
              <span className="tool-mark" aria-hidden>{item.state === 'running' ? '' : item.state === 'done' ? '✓' : '!'}</span>
              <span className="min-w-0">
                <span className="font-medium">{item.state === 'running' ? `${item.status}…` : item.status}</span>
                {item.note && <span className="block text-[var(--muted)]">{item.note}</span>}
              </span>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="border-t border-[var(--line)] p-3">
        {modelDown && ['draw', 'ideas', 'picks', 'buy'].includes(stage) && !store.onlyYourChoiceLeft() && (
          <button type="button" disabled={busy} onClick={() => void store.runWithoutModel()} className="mb-2 w-full rounded-lg bg-[var(--pine)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-dark)] disabled:opacity-50">
            Run the exchange without the assistant
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" disabled={busy} onClick={() => send(suggestion)} className="suggestion rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--pine)] hover:text-[var(--pine)] disabled:opacity-50">
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(text);
          }}
        >
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask Tinsel" aria-label="Ask Tinsel" maxLength={500} className="min-w-0 flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--pine)]" />
          <button type="submit" disabled={busy || !text.trim()} className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}
