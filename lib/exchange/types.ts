// The gift exchange as plain data, independent of the screens that show it and of the assistant.

export type Person = {
  id: string;
  name: string;
  team: string;
  likes: string;
  avoid: string;
  /** A link to something they'd love. */
  wishlistUrl?: string;
  /** A picture of something they like, at a public address. */
  photoUrl?: string;
  /** This person is happy to let the assistant choose the gift they give. */
  letTinselPick: boolean;
  /** The person using this browser. */
  isYou?: boolean;
};

/** A budget held on PayPal: reserved, not charged. */
export type Hold = {
  orderId: string;
  authorizationId: string;
  held: number;
  status: 'HELD' | 'CHARGED' | 'RELEASED';
  charged?: number;
  released?: number;
  captureId?: string;
  fee?: number;
  expiresAt?: string;
  placedWith: 'paypal' | 'test-card';
};

export type Product = {
  id: string;
  title: string;
  brand?: string;
  price: number;
  /** The retailer's domain. */
  merchant: string;
  /** Where to buy it. */
  url: string;
  image?: string;
  rating?: number;
  reviews?: number;
};

export type Idea = { product: Product; reason: string };

export type Pick = { productId: string; by: 'giver' | 'tinsel'; why?: string };

export type Purchase = {
  product: Product;
  charged: number;
  released: number;
  captureId: string;
  /** What the retailer asked when the idea was proposed, if the price moved before buying. */
  earlierPrice?: number;
  sticker?: string;
};

export type Exchange = {
  name: string;
  budget: number;
  /** When people open their gifts, as YYYY-MM-DD. */
  date: string;
  people: Person[];
  /** Pairs who shouldn't draw each other. */
  keptApart: [string, string][];
  holds: Record<string, Hold>;
  /** Giver to recipient, once names are drawn. */
  draw: Record<string, string> | null;
  /**
   * Slot to giver. The assistant only ever sees slots and anonymous tastes, so it can't tell anyone
   * who drew whom, because it doesn't know.
   */
  slots: Record<string, string> | null;
  candidates: Record<string, Product[]>;
  ideas: Record<string, Idea[]>;
  picks: Record<string, Pick>;
  bought: Record<string, Purchase>;
  droppedOut: string[];
  cancelled: boolean;
  revealed: boolean;
};

export type Stage = 'holds' | 'draw' | 'ideas' | 'picks' | 'buy' | 'reveal' | 'revealed' | 'cancelled';
