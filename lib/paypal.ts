// Budget holds on PayPal, through the PayPal Server SDK: an order with the AUTHORIZE intent reserves
// the money, a capture takes the exact price and releases the rest, a void gives it all back.
// Sandbox only: the environment is fixed in code. Server-side only: it reads the client secret.

import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
  PaymentsController,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk';

export const BRAND = 'Tinsel';

let client: Client | undefined;

function sdkClient(): Client {
  if (client) return client;
  const { PAYPAL_CLIENT_ID: id, PAYPAL_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set.');
  client = new Client({
    clientCredentialsAuthCredentials: { oAuthClientId: id, oAuthClientSecret: secret },
    environment: Environment.Sandbox,
    timeout: 20_000,
    // The sandbox has bad moments. Every write below carries a PayPal-Request-Id, so sending one again is safe.
    httpClientOptions: {
      retryConfig: {
        maxNumberOfRetries: 2,
        maximumRetryWaitTime: 10,
        httpStatusCodesToRetry: [429, 500, 502, 503, 504],
        httpMethodsToRetry: ['GET', 'POST'],
      },
    },
  });
  return client;
}

const orders = () => new OrdersController(sdkClient());
const payments = () => new PaymentsController(sdkClient());

export type HoldReceipt = { orderId: string; authorizationId: string; held: number; expiresAt?: string };

/** PayPal's own reason for refusing, such as MAX_CAPTURE_AMOUNT_EXCEEDED. */
export function paypalIssue(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const result = error.result as { details?: { issue?: string }[]; name?: string } | undefined;
  return result?.details?.[0]?.issue ?? result?.name;
}

const unitFor = (personId: string, amount: number) => ({
  // Tagged, so that a ledger shared with another demo can tell these apart.
  customId: `tinsel:${personId}`,
  description: 'Gift exchange budget. Held on your account, and only the gift price is charged.',
  softDescriptor: 'TINSEL',
  amount: { currencyCode: 'USD', value: amount.toFixed(2) },
});

function receiptFrom(order: { id?: string; purchaseUnits?: { payments?: { authorizations?: { id?: string; amount?: { value?: string }; expirationTime?: string }[] } }[] }): HoldReceipt {
  const authorization = order.purchaseUnits?.[0]?.payments?.authorizations?.[0];
  if (!order.id || !authorization?.id) throw new Error('PayPal did not place the hold.');
  return { orderId: order.id, authorizationId: authorization.id, held: Number(authorization.amount?.value ?? 0), expiresAt: authorization.expirationTime };
}

/** An order for someone to approve in PayPal's window. */
export async function createHoldOrder(personId: string, amount: number): Promise<string> {
  const { result } = await orders().createOrder({
    body: {
      intent: CheckoutPaymentIntent.Authorize,
      purchaseUnits: [unitFor(personId, amount)],
      paymentSource: {
        paypal: {
          experienceContext: {
            brandName: BRAND,
            shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
            userAction: PaypalExperienceUserAction.Continue,
          },
        },
      },
    },
    paypalRequestId: `tinsel-order-${personId}-${crypto.randomUUID()}`,
    prefer: 'return=minimal',
  });
  if (!result.id) throw new Error('PayPal returned no order id.');
  return result.id;
}

/**
 * Places the hold once the person has approved. A slow answer can make the call go out twice, and the
 * second one comes back refused even though the hold is in place, so that case reads the order instead.
 */
export async function authorizeHold(orderId: string): Promise<HoldReceipt> {
  try {
    const { result } = await orders().authorizeOrder({ id: orderId, paypalRequestId: `tinsel-authorize-${orderId}`, prefer: 'return=representation', body: {} });
    return receiptFrom({ ...result, id: result.id ?? orderId });
  } catch (error) {
    if (paypalIssue(error) !== 'ORDER_ALREADY_AUTHORIZED') throw error;
    const { result } = await orders().getOrder({ id: orderId });
    return receiptFrom({ ...result, id: result.id ?? orderId });
  }
}

/**
 * The demo's colleagues aren't there to click, so their holds use PayPal's published sandbox test
 * card. They are real sandbox authorizations, captured and voided like any other.
 */
export async function holdWithTestCard(personId: string, name: string, amount: number): Promise<HoldReceipt> {
  const { result } = await orders().createOrder({
    body: {
      intent: CheckoutPaymentIntent.Authorize,
      purchaseUnits: [unitFor(personId, amount)],
      paymentSource: {
        card: {
          name,
          number: '4111111111111111',
          expiry: '2030-12',
          securityCode: '123',
          billingAddress: { addressLine1: '1 Sandbox Way', adminArea2: 'San Jose', adminArea1: 'CA', postalCode: '95131', countryCode: 'US' },
        },
      },
    },
    paypalRequestId: `tinsel-hold-${personId}-${crypto.randomUUID()}`,
    prefer: 'return=representation',
  });
  return receiptFrom(result);
}

export async function readHold(authorizationId: string): Promise<{ status: string; held: number }> {
  const { result } = await payments().getAuthorizedPayment({ authorizationId });
  return { status: result.status ?? 'UNKNOWN', held: Number(result.amount?.value ?? 0) };
}

/** Takes `amount` from the hold and closes it, which gives the rest back. PayPal refuses more than was held. */
export async function chargeHold(authorizationId: string, amount: number, note: string) {
  const { result } = await payments().captureAuthorizedPayment({
    authorizationId,
    // A retry of the same capture returns the first result instead of charging again.
    paypalRequestId: `tinsel-capture-${authorizationId}`,
    prefer: 'return=representation',
    body: {
      amount: { currencyCode: 'USD', value: amount.toFixed(2) },
      finalCapture: true,
      noteToPayer: note.slice(0, 255),
      softDescriptor: 'TINSEL',
    },
  });
  if (!result.id) throw new Error('PayPal did not capture the payment.');
  return {
    captureId: result.id,
    status: result.status ?? 'UNKNOWN',
    charged: Number(result.amount?.value ?? amount),
    fee: Number(result.sellerReceivableBreakdown?.paypalFee?.value ?? 0),
  };
}

export async function releaseHold(authorizationId: string): Promise<void> {
  await payments().voidPayment({ authorizationId, paypalRequestId: `tinsel-void-${authorizationId}`, prefer: 'return=minimal' });
}

/** Whether PayPal answers with these credentials, for the health check. */
export async function canReachPayPal(): Promise<boolean> {
  await sdkClient().clientCredentialsAuthManager.fetchToken();
  return true;
}
