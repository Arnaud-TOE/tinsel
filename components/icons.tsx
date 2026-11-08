import type { SVGProps } from 'react';

// Line icons for the public pages, on a 24px grid in the current colour.
type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const WalletIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-4a2 2 0 0 0 0 4h4v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5" />
  </svg>
);

export const ShuffleIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2 18h1.4a4 4 0 0 0 3.3-1.8l5.6-8.4A4 4 0 0 1 15.6 6H22M2 6h1.4a4 4 0 0 1 3.3 1.8l.8 1.2M22 18h-6.4a4 4 0 0 1-3.3-1.8l-.8-1.2M18 2l4 4-4 4M18 14l4 4-4 4" />
  </svg>
);

export const BagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export const ReceiptIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2-3-2ZM8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M10.7 5.1A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const TagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4l-8.7-8.7Z" />
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const GiftIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />
  </svg>
);
