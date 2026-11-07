'use client';

// PayPal's own button, from the JavaScript SDK v6. The server creates the order with the AUTHORIZE
// intent, so approving it reserves the money and charges nothing.

import { useEffect, useRef, useState } from 'react';
import type { ExchangeStore } from './store';

const SDK_URL = 'https://www.sandbox.paypal.com/web-sdk/v6/core';

type PaymentSession = {
  start: (options: { presentationMode: 'auto' }, order: Promise<{ orderId: string }>) => Promise<void>;
};
type SdkInstance = {
  findEligibleMethods: (options: { currencyCode: string }) => Promise<{ isEligible: (method: string) => boolean }>;
  createPayPalOneTimePaymentSession: (options: {
    onApprove: (data: { orderId: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => PaymentSession;
};

declare global {
  interface Window {
    paypal?: { createInstance: (options: Record<string, unknown>) => Promise<SdkInstance> };
  }
}

function loadSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
  return new Promise((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement('script'), { src: SDK_URL, async: true });
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('The PayPal SDK failed to load.')));
    if (!existing) document.head.appendChild(script);
  });
}

export function PayPalHoldButton({ store, clientId }: { store: ExchangeStore; clientId: string }) {
  const buttonRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'working'>('loading');

  useEffect(() => {
    let cancelled = false;
    const button = buttonRef.current;
    let onClick: (() => void) | undefined;

    (async () => {
      try {
        await loadSdk();
        if (!window.paypal) throw new Error('The PayPal SDK failed to load.');
        const sdk = await window.paypal.createInstance({ clientId, components: ['paypal-payments'], pageType: 'checkout' });
        const methods = await sdk.findEligibleMethods({ currencyCode: 'USD' });
        if (!methods.isEligible('paypal')) throw new Error('PayPal is not available in this browser.');

        const session = sdk.createPayPalOneTimePaymentSession({
          onApprove: async ({ orderId }) => {
            setState('working');
            try {
              await store.finishYourHold(orderId);
            } catch (error) {
              store.fail((error as Error).message);
              setState('ready');
            }
          },
          onCancel: () => setState('ready'),
          onError: (error) => {
            store.fail(error.message || 'PayPal reported an error.');
            setState('ready');
          },
        });

        onClick = () => {
          session.start({ presentationMode: 'auto' }, store.createYourOrder()).catch((error: Error) => store.fail(error.message));
        };
        if (cancelled) return;
        button?.addEventListener('click', onClick);
        button?.removeAttribute('hidden');
        setState('ready');
      } catch (error) {
        if (!cancelled) store.fail((error as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      if (onClick) button?.removeEventListener('click', onClick);
    };
  }, [clientId, store]);

  return (
    <div className="mt-2" aria-busy={state !== 'ready'}>
      <paypal-button ref={buttonRef} hidden className="block w-full" />
      {state === 'loading' && <p className="text-xs text-[var(--muted)]">Loading PayPal…</p>}
      {state === 'working' && <p className="text-xs text-[var(--muted)]">Placing your hold…</p>}
    </div>
  );
}
