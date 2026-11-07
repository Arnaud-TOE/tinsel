import { z } from 'zod';
import { isSameOrigin } from '@/lib/guard';
import { paypalIssue, readHold, releaseHold } from '@/lib/paypal';

// Gives a hold back: someone dropped out, or the exchange was cancelled.

const releaseRequest = z.object({ authorizationId: z.string().regex(/^[A-Z0-9]{8,40}$/) });

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Tinsel app.');
  const parsed = releaseRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, 'That is not a hold this app can release.');

  try {
    const { status } = await readHold(parsed.data.authorizationId);
    // Already over: nothing left to give back, and that isn't a failure.
    if (status === 'CREATED') await releaseHold(parsed.data.authorizationId);
    return Response.json({ released: true });
  } catch (cause) {
    console.error('[holds] could not release', parsed.data.authorizationId, paypalIssue(cause) ?? cause);
    return error(502, 'PayPal could not release the hold just now.');
  }
}
