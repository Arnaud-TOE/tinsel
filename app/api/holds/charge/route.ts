import { z } from 'zod';
import { currentProduct } from '@/lib/channel3';
import { decideCharge } from '@/lib/charge';
import { isSameOrigin } from '@/lib/guard';
import { chargeHold, paypalIssue, readHold } from '@/lib/paypal';

// Buying a gift. The browser only names the hold and the product: the price comes from Channel3, as it
// stands right now, and the ceiling from PayPal. Neither the page nor the model can name an amount.

const chargeRequest = z.object({
  authorizationId: z.string().regex(/^[A-Z0-9]{8,40}$/),
  productId: z.string().min(1).max(100),
});

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Tinsel app.');

  const parsed = chargeRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, 'That is not a purchase this app can make.');
  const { authorizationId, productId } = parsed.data;

  try {
    const [product, hold] = await Promise.all([currentProduct(productId), readHold(authorizationId)]);
    const decision = decideCharge(product, hold);
    if (!decision.ok) return error(409, decision.message);

    const capture = await chargeHold(authorizationId, decision.amount, `Your Tinsel gift: ${product!.title}. The rest of your budget has been released.`);
    return Response.json({ product, charged: capture.charged, released: decision.released, captureId: capture.captureId, fee: capture.fee });
  } catch (cause) {
    const issue = paypalIssue(cause);
    console.error('[holds] could not charge', authorizationId, issue ?? cause);
    if (issue === 'MAX_CAPTURE_AMOUNT_EXCEEDED') return error(409, 'PayPal refused: that is more than was held.');
    return error(502, "The purchase didn't go through, and nothing was charged.");
  }
}
