import { z } from 'zod';
import { Channel3Error, lookupProduct, productSticker, searchByImage, searchProducts, similarProducts } from '@/lib/channel3';
import { isSameOrigin, shopCallAllowed } from '@/lib/guard';

// Every Channel3 call the exchange makes, behind one route that holds the key.

const MAX_BUDGET = 500;
const maxPrice = z.number().positive().max(MAX_BUDGET);

const shopRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('search'), query: z.string().min(1).max(200), maxPrice }),
  z.object({ action: z.literal('photo'), imageUrl: z.url().max(2000), maxPrice }),
  // About 6 MB of picture: enough for a phone photo, not enough to tie up the server.
  z.object({ action: z.literal('upload'), base64: z.string().min(16).max(8_000_000), maxPrice }),
  z.object({ action: z.literal('lookup'), url: z.url().max(2000) }),
  z.object({ action: z.literal('similar'), productId: z.string().min(1).max(100), maxPrice }),
  z.object({ action: z.literal('sticker'), productId: z.string().min(1).max(100) }),
]);

const error = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Tinsel app.');
  if (!shopCallAllowed(request)) return error(429, 'That was a lot of searching for one visitor. Please try again in a few minutes.');

  const parsed = shopRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, 'That is not a search this app can run.');
  const ask = parsed.data;

  try {
    switch (ask.action) {
      case 'search':
        return Response.json({ products: await searchProducts(ask.query, ask.maxPrice) });
      case 'photo':
        return Response.json({ products: await searchByImage({ url: ask.imageUrl }, ask.maxPrice) });
      case 'upload':
        return Response.json({ products: await searchByImage({ base64: ask.base64 }, ask.maxPrice) });
      case 'lookup':
        return Response.json({ product: await lookupProduct(ask.url) });
      case 'similar':
        return Response.json({ products: await similarProducts(ask.productId, ask.maxPrice) });
      case 'sticker':
        return Response.json({ sticker: await productSticker(ask.productId) });
    }
  } catch (cause) {
    console.error('[shop]', ask.action, cause);
    if (cause instanceof Channel3Error && cause.status === 503) return error(503, "The shops aren't connected on this server yet.");
    return error(502, "The shops didn't answer. Please try again in a moment.");
  }
}
