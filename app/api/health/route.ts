import { canReachPayPal } from '@/lib/paypal';

// For checking that a deployment is configured and PayPal answers. Says what is set up, never the values.
export async function GET() {
  const paypal = await canReachPayPal().catch(() => false);
  return Response.json(
    { status: paypal ? 'ok' : 'degraded', paypal, channel3: Boolean(process.env.CHANNEL3_API_KEY), ai: Boolean(process.env.OPENAI_API_KEY) },
    { status: paypal ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
