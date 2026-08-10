/**
 * Icons: 16px, 1.5px stroke, one family throughout.
 *
 * Inline rather than from a package — five glyphs do not justify a dependency,
 * and hand-drawn paths let them share an optical weight with 13px text.
 */

type Props = { className?: string };

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TodayIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M2 12.5 5.5 8l2.5 2.5L14 4" />
      <path d="M10.5 4H14v3.5" />
    </svg>
  );
}

export function AppraiseIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M8 2v12" />
      <path d="M3.5 5.5h9" />
      <path d="M1.5 10.5 3.5 5.5l2 5a2 2 0 0 1-4 0Z" />
      <path d="M10.5 10.5l2-5 2 5a2 2 0 0 1-4 0Z" />
    </svg>
  );
}

export function StockIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="2" y="2.5" width="12" height="4" rx="1" />
      <rect x="2" y="9.5" width="12" height="4" rx="1" />
    </svg>
  );
}

export function MarketIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M2 13V3" />
      <path d="M2 13h12" />
      <path d="M4.5 10.5 7 7l2.5 2 3-4.5" />
    </svg>
  );
}

export function PerformanceIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.75V8l2.25 1.5" />
    </svg>
  );
}

export function SearchIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="7.25" cy="7.25" r="4.25" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

export function SettingsIcon({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.5v1.75M8 12.75v1.75M14.5 8h-1.75M3.25 8H1.5M12.6 3.4l-1.24 1.24M4.64 11.36 3.4 12.6M12.6 12.6l-1.24-1.24M4.64 4.64 3.4 3.4" />
    </svg>
  );
}
