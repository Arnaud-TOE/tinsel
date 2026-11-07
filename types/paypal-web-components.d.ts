// JSX typing for the web components the PayPal JavaScript SDK v6 registers.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'paypal-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: 'pay' | 'donate' | 'checkout' };
    }
  }
}
