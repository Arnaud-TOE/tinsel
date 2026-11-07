import { z } from 'zod';
import { holdAllowed, isSameOrigin } from '@/lib/guard';
import { createHoldOrder, holdWithTestCard, paypalIssue } from '@/lib/paypal';

// Starts a budget hold: either an order for a person to approve in PayPal's window, or, for the demo's
// colleagues, a hold placed straight away with PayPal's published sandbox test card.

const MAX_BUDGET = 500;

const holdRequest = z.object({
  personId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().min(1).max(80),
  amount: z.number().positive().max(MAX_BUDGET),
  method: z.enum(['paypal', 'test-card']),
});

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Tinsel app.');
  if (!holdAllowed()) return error(429, "The demo's holds for today are used up. They reset within a day.");

  const parsed = holdRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, 'That is not a hold this app can place.');
  const { personId, name, amount, method } = parsed.data;

  try {
    if (method === 'paypal') return Response.json({ orderId: await createHoldOrder(personId, amount) });
    return Response.json(await holdWithTestCard(personId, name, amount));
  } catch (cause) {
    console.error('[holds] could not place the hold', paypalIssue(cause) ?? cause);
    return error(502, 'PayPal could not place the hold. Nothing was reserved.');
  }
}
