// Channel3: 100M+ real products behind one API. On the server only, because it reads the API key.
// Everything the exchange shows comes through `toProduct`, so a product with no buyable offer never
// reaches the screen or the model.

import type { Product } from './exchange/types';

const BASE_URL = 'https://api.trychannel3.com';
const TIMEOUT_MS = 20_000;

export class Channel3Error extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type RawOffer = {
  url?: string;
  domain?: string;
  price?: { price?: number; currency?: string };
  availability?: string;
  condition?: string | null;
};

export type RawProduct = {
  id: string;
  title: string;
  brands?: { name?: string }[];
  images?: { url?: string; cleaned_url?: string; is_main_image?: boolean }[];
  offers?: RawOffer[];
  ratings?: { value?: number; count?: number } | null;
};

/** The cheapest offer someone could buy today: in stock, new, in dollars. */
function bestOffer(offers: RawOffer[] = []) {
  return offers
    .filter((offer) => offer.url && offer.availability === 'InStock' && offer.condition !== 'used' && offer.price?.currency === 'USD' && typeof offer.price?.price === 'number')
    .sort((a, b) => a.price!.price! - b.price!.price!)[0];
}

// A gift card says nothing about the person, and searches for tastes still turn them up.
const GIFT_CARD = /\b(e-?)?gift ?cards?\b|\bgift certificate\b/i;

export function toProduct(raw: RawProduct): Product | null {
  if (GIFT_CARD.test(raw.title)) return null;
  const offer = bestOffer(raw.offers);
  if (!offer) return null;
  const image = raw.images?.find((candidate) => candidate.is_main_image) ?? raw.images?.[0];
  return {
    id: raw.id,
    title: raw.title,
    ...(raw.brands?.[0]?.name ? { brand: raw.brands[0].name } : {}),
    price: offer.price!.price!,
    merchant: offer.domain ?? new URL(offer.url!).hostname,
    url: offer.url!,
    ...(image?.cleaned_url || image?.url ? { image: image.cleaned_url ?? image.url } : {}),
    ...(raw.ratings?.value ? { rating: raw.ratings.value, reviews: raw.ratings.count ?? 0 } : {}),
  };
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown, { timeoutMs = TIMEOUT_MS, attempts = 3 } = {}): Promise<T> {
  const key = process.env.CHANNEL3_API_KEY;
  if (!key) throw new Channel3Error(503, 'CHANNEL3_API_KEY is not set.');
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'x-api-key': key, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    }).catch((cause: Error) => {
      if (cause.name === 'TimeoutError') throw new Channel3Error(504, `Channel3 took too long on ${path}.`);
      throw cause;
    });
    if (response.ok) return (await response.json()) as T;
    if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      continue;
    }
    const detail = await response.text().catch(() => '');
    throw new Channel3Error(response.status, `Channel3 answered ${response.status} on ${path}: ${detail.slice(0, 200)}`);
  }
}

// In stock, new and under budget: what a present has to be, whatever the search says.
const giftFilters = (maxPrice: number) => ({
  price: { max_price: maxPrice },
  availability: ['InStock'],
  conditions: ['new'],
});

const US = { country: 'US', currency: 'USD' };

/** What can be bought, once each: a catalog often lists one product several times, as variants. */
export function toProducts(list: RawProduct[] = []): Product[] {
  const seen = new Set<string>();
  return list
    .map(toProduct)
    .filter((product): product is Product => product !== null)
    .filter((product) => {
      const key = `${product.title.toLowerCase()}|${product.merchant}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function searchProducts(query: string, maxPrice: number): Promise<Product[]> {
  // Agentic search reads a request like a person would, which suits gifts better than matching words.
  const answer = await call<{ products: RawProduct[] }>('POST', '/v1/search', { query, limit: 12, filters: giftFilters(maxPrice), config: { ...US, mode: 'agentic' } });
  return toProducts(answer.products);
}

export async function searchByImage(image: { url: string } | { base64: string }, maxPrice: number): Promise<Product[]> {
  const source = 'url' in image ? { image_url: image.url } : { base64_image: image.base64 };
  const answer = await call<{ products: RawProduct[] }>('POST', '/v1/search', { ...source, limit: 12, filters: giftFilters(maxPrice), config: US });
  return toProducts(answer.products);
}

export async function similarProducts(productId: string, maxPrice: number): Promise<Product[]> {
  const answer = await call<{ products: RawProduct[] }>('POST', '/v1/similar', { product_id: productId, limit: 12, filters: giftFilters(maxPrice), config: US });
  return toProducts(answer.products);
}

const unreadable = (error: unknown) => error instanceof Channel3Error && [404, 422, 500, 504].includes(error.status);

/**
 * Reads any product link. A link the catalog knows comes back at once. Any other page has to be fetched
 * live, which some shops block or draw out, so that gets one short try. Null when it isn't a product we
 * can read, or nobody can sell it to you today.
 */
export async function lookupProduct(url: string): Promise<Product | null> {
  try {
    const answer = await call<{ product: RawProduct }>('POST', '/v1/lookup', { url, realtime_fetch: false });
    return toProduct(answer.product);
  } catch (error) {
    if (!unreadable(error)) throw error;
  }
  try {
    const answer = await call<{ product: RawProduct }>('POST', '/v1/lookup', { url }, { timeoutMs: 12_000, attempts: 1 });
    return toProduct(answer.product);
  } catch (error) {
    if (unreadable(error)) return null;
    throw error;
  }
}

/** The product as it stands right now. Null when it has no buyable offer any more. */
export async function currentProduct(productId: string): Promise<Product | null> {
  try {
    return toProduct(await call<RawProduct>('GET', `/v1/products/${encodeURIComponent(productId)}?country=US&currency=USD`));
  } catch (error) {
    if (error instanceof Channel3Error && error.status === 404) return null;
    throw error;
  }
}

/** A cut-out picture of the product, for opening the gift. Null when it can't be made: the regular image will do. */
export async function productSticker(productId: string): Promise<string | null> {
  try {
    const answer = await call<{ sticker_url?: string }>('POST', '/experimental/sticker', { product_id: productId });
    return answer.sticker_url ?? null;
  } catch {
    return null;
  }
}
