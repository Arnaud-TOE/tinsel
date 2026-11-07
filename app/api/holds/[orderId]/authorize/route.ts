import { isSameOrigin } from '@/lib/guard';
import { authorizeHold, paypalIssue } from '@/lib/paypal';

// Someone approved the hold in PayPal's window: this places it.
export async function POST(request: Request, { params }: RouteContext<'/api/holds/[orderId]/authorize'>) {
  if (!isSameOrigin(request)) return Response.json({ error: 'This endpoint only serves the Tinsel app.' }, { status: 403 });
  const { orderId } = await params;
  if (!/^[A-Z0-9-]{8,40}$/.test(orderId)) return Response.json({ error: 'That is not a PayPal order.' }, { status: 400 });

  try {
    return Response.json(await authorizeHold(orderId));
  } catch (cause) {
    console.error('[holds] could not authorize', orderId, paypalIssue(cause) ?? cause);
    return Response.json({ error: 'PayPal could not place the hold. Nothing was reserved.' }, { status: 502 });
  }
}
