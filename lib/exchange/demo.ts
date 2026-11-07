// The demo's team. Everyone here is fictional. Each person's tastes are written so that a different part
// of the shopping tools gets used: plain search, a wishlist link, a photo.

import type { Exchange, Person } from './types';

export const TEAM_NAME = 'Fernhill Studio';

export const DEMO_PEOPLE: Person[] = [
  {
    id: 'sam',
    name: 'Sam Ellis',
    team: 'Operations',
    likes: 'Trail running and very strong coffee',
    avoid: 'Scented candles',
    letTinselPick: false,
    isYou: true,
  },
  {
    id: 'maya',
    name: 'Maya Chen',
    team: 'Design',
    likes: 'Handmade ceramics, matcha and houseplants',
    avoid: 'Anything with a slogan on it',
    // A blue glazed bowl, from Channel3's image store.
    photoUrl: 'https://cdn.trychannel3.com/3c6cd53b-dbce-4bda-8d86-ed714b864659?aid=01M6VEYDCYE9PXJD6CX38TX12Q&mid=0FQp',
    letTinselPick: true,
  },
  {
    id: 'ben',
    name: 'Ben Adeyemi',
    team: 'Engineering',
    likes: 'Mechanical keyboards, board games and hot sauce',
    avoid: 'Socks',
    letTinselPick: true,
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    team: 'Product',
    likes: 'Fountain pens, loose-leaf tea and mystery novels',
    avoid: 'Mugs. There are too many already.',
    letTinselPick: true,
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    team: 'Sales',
    likes: 'Commuting by bike and camping',
    avoid: 'Alcohol',
    wishlistUrl: 'https://www.rei.com/product/122366',
    letTinselPick: true,
  },
  {
    id: 'lucia',
    name: 'Lucía Romero',
    team: 'Support',
    likes: 'Baking, and presents that get used up',
    avoid: 'Clutter and desk toys',
    letTinselPick: true,
  },
];

/** The opening day is three weeks from `now`, so the demo always looks ahead. */
export function demoExchange(now: Date = new Date()): Exchange {
  const date = new Date(now.getTime() + 21 * 86_400_000).toISOString().slice(0, 10);
  return {
    name: `${TEAM_NAME} holiday exchange`,
    budget: 30,
    date,
    people: DEMO_PEOPLE,
    // Ben and Priya live together, and already know what the other wants.
    keptApart: [['ben', 'priya']],
    holds: {},
    draw: null,
    slots: null,
    candidates: {},
    ideas: {},
    picks: {},
    bought: {},
    droppedOut: [],
    cancelled: false,
    revealed: false,
  };
}
