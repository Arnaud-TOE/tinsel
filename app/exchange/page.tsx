import type { Metadata } from 'next';
import { ExchangeLoader } from './loader';

export const metadata: Metadata = {
  title: 'The exchange | Tinsel',
  description: "A team's gift exchange run end to end by an assistant: PayPal holds each budget, Channel3 finds the gifts, and only the exact price is charged.",
};

export default function ExchangePage() {
  return <ExchangeLoader clientId={process.env.PAYPAL_CLIENT_ID ?? ''} />;
}
