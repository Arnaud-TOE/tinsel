/** A bauble, with a little gold cap. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="19" r="11" fill="var(--berry)" />
      <path d="M7.5 15.5c3 2.2 5.8 3.2 8.5 3.2s5.5-1 8.5-3.2" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="12.5" y="4.5" width="7" height="4.5" rx="1" fill="var(--gold)" />
    </svg>
  );
}
