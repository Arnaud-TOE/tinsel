'use client';

/* eslint-disable @next/next/no-img-element -- Product and uploaded pictures come from any domain. */

import { useState } from 'react';
import type { Person, Product } from '@/lib/exchange/types';
import type { ExchangeStore } from './store';

const usd = (amount: number) => `$${amount.toFixed(2)}`;
const MAX_PHOTO_BYTES = 4_000_000;

/** Your mini-profile. A link is read as you paste it, so you can see how the assistant will treat it. */
export function ProfileEditor({ store, person, budget }: { store: ExchangeStore; person: Person; budget: number }) {
  const [open, setOpen] = useState(false);
  const [likes, setLikes] = useState(person.likes);
  const [avoid, setAvoid] = useState(person.avoid);
  const [wishlist, setWishlist] = useState(person.wishlistUrl ?? '');
  const [photo, setPhoto] = useState(person.photoUrl ?? '');
  const [found, setFound] = useState<Product | null | 'checking' | 'unreadable'>(null);
  const [photoError, setPhotoError] = useState('');

  async function readLink() {
    if (!wishlist.trim()) return setFound(null);
    setFound('checking');
    try {
      setFound((await store.lookup(wishlist.trim())) ?? 'unreadable');
    } catch {
      setFound('unreadable');
    }
  }

  function readPhoto(file: File | undefined) {
    setPhotoError('');
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) return setPhotoError('Please use a picture under 4 MB.');
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (!open) {
    return (
      <button type="button" className="shrink-0 rounded-md border border-[var(--line)] px-2 py-1 text-xs hover:bg-[var(--wash)]" onClick={() => setOpen(true)}>
        Your tastes
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <form
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          store.updateYou({ likes: likes.trim() || person.likes, avoid: avoid.trim() || person.avoid, wishlistUrl: wishlist.trim() || undefined, photoUrl: photo || undefined });
          setOpen(false);
        }}
      >
        <h2 id="profile-title" className="font-display text-2xl font-semibold">
          What would you love?
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Tinsel shops from this. Your name stays out of it: it only sees your tastes.</p>

        <label className="mt-4 block text-sm font-medium">
          What you love
          <input value={likes} onChange={(event) => setLikes(event.target.value)} maxLength={200} className="field" />
        </label>
        <label className="mt-3 block text-sm font-medium">
          What nobody should give you
          <input value={avoid} onChange={(event) => setAvoid(event.target.value)} maxLength={200} className="field" />
        </label>
        <label className="mt-3 block text-sm font-medium">
          A link to something you want <span className="font-normal text-[var(--muted)]">(optional)</span>
          <input type="url" value={wishlist} onChange={(event) => setWishlist(event.target.value)} onBlur={() => void readLink()} placeholder="https://" className="field" />
        </label>
        {found === 'checking' && <p className="mt-1 text-xs text-[var(--muted)]">Reading the link…</p>}
        {found === 'unreadable' && <p className="mt-1 text-xs text-[var(--muted)]">That link isn&rsquo;t a product we can read. Tinsel will shop from your tastes instead.</p>}
        {found && typeof found === 'object' && (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[var(--wash)] p-2 text-xs">
            {found.image && <img src={found.image} alt="" className="size-12 rounded-lg bg-white object-contain" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{found.title}</p>
              <p className="text-[var(--muted)]">{found.price <= budget ? `${usd(found.price)}, within the ${usd(budget)} budget.` : `${usd(found.price)}, over the ${usd(budget)} budget. Tinsel will look for something similar.`}</p>
            </div>
          </div>
        )}
        <label className="mt-3 block text-sm font-medium">
          A photo of something you like <span className="font-normal text-[var(--muted)]">(optional)</span>
          <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0])} className="mt-1 block w-full text-sm" />
        </label>
        {photoError && <p className="mt-1 text-xs text-red-800">{photoError}</p>}
        {photo.startsWith('data:') && <img src={photo} alt="Your photo" className="mt-2 h-20 rounded-lg object-cover" />}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--wash)]" onClick={() => setOpen(false)}>
            Never mind
          </button>
          <button type="submit" className="rounded-lg bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
