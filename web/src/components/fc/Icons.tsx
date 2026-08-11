import React from "react";

type IconProps = {
  size?: number;
  className?: string;
};

function Svg({
  size = 16,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ==========================================================================
   Dot-matrix endpoint glyphs

   Firecrawl marks each API endpoint with a small pixel-matrix glyph rather
   than a line icon. The exact SVGs are not published, so these are rebuilt
   from the screenshots on the same 5x5 grid the originals sit on.
   ========================================================================== */

function DotMatrix({ pattern, size = 16, className }: IconProps & { pattern: string[] }) {
  const cells = pattern.length;
  const step = 16 / cells;
  const dot = Math.max(1.2, step * 0.42);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {pattern.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x * step + (step - dot) / 2}
              y={y * step + (step - dot) / 2}
              width={dot}
              height={dot}
              rx={dot / 4}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export const ScrapeIcon = (p: IconProps) => (
  <DotMatrix
    {...p}
    pattern={["#####", "#####", "#####", "#####", "#####"]}
  />
);

export const SearchEndpointIcon = (p: IconProps) => (
  <DotMatrix
    {...p}
    pattern={[".###.", "#...#", "#...#", ".###.", "....#"]}
  />
);

export const MapIcon = (p: IconProps) => (
  <DotMatrix
    {...p}
    pattern={["#.#.#", ".....", "#.#.#", ".....", "#.#.#"]}
  />
);

export const CrawlIcon = (p: IconProps) => (
  <DotMatrix
    {...p}
    pattern={["#...#", ".#.#.", "..#..", ".#.#.", "#...#"]}
  />
);

export const ExtractIcon = (p: IconProps) => (
  <DotMatrix
    {...p}
    pattern={["#####", ".....", "###..", ".....", "#####"]}
  />
);

/* ==========================================================================
   UI icons
   ========================================================================== */

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 6.8 8 2.5l5.5 4.3V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V6.8Z" />
  </Svg>
);

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 2.8 12.5 8 4 13.2V2.8Z" />
  </Svg>
);

export const LogsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 4h1M2.5 8h1M2.5 12h1M6 4h7.5M6 8h7.5M6 12h7.5" />
  </Svg>
);

export const UsageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 13.5V9M6.5 13.5V4M10.5 13.5V7M14.5 13.5v-3" />
  </Svg>
);

export const KeyIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5" cy="5" r="2.6" />
    <path d="m6.9 6.9 6 6M11 11l-1.4 1.4M12.9 12.9l1.4-1.4" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2.1" />
    <path d="M8 1.8v1.4M8 12.8v1.4M14.2 8h-1.4M3.2 8H1.8M12.4 3.6l-1 1M4.6 11.4l-1 1M12.4 12.4l-1-1M4.6 4.6l-1-1" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7.2" cy="7.2" r="4.4" />
    <path d="m10.6 10.6 2.6 2.6" />
  </Svg>
);

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.6a4 4 0 0 1 8 0c0 3 .9 4.2.9 4.2H3.1S4 9.6 4 6.6Z" />
    <path d="M6.6 13a1.6 1.6 0 0 0 2.8 0" />
  </Svg>
);

export const HelpIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M6.4 6.3a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1.1v.3" />
    <path d="M8 11.6h.01" />
  </Svg>
);

export const DocsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 2.5h5L12.5 6v7.5h-9v-11Z" />
    <path d="M8.5 2.5V6h4" />
  </Svg>
);

export const UpgradeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 10.5V3.2M5.2 6 8 3.2 10.8 6" />
    <path d="M3 12.8h10" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 6.2 4 4 4-4" />
  </Svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m10 3.5-4.5 4.5L10 12.5" />
  </Svg>
);

export const ChevronUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 9.8 4-4 4 4" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" />
  </Svg>
);

export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 3h3.5v3.5" />
    <path d="M12.6 3.4 7.8 8.2" />
    <path d="M11 9.6v3a.9.9 0 0 1-.9.9H3.4a.9.9 0 0 1-.9-.9V5.9a.9.9 0 0 1 .9-.9h3" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.6" y="5.6" width="7.9" height="7.9" rx="1.4" />
    <path d="M10.4 5.6V3.9a1.4 1.4 0 0 0-1.4-1.4H3.9a1.4 1.4 0 0 0-1.4 1.4V9a1.4 1.4 0 0 0 1.4 1.4h1.7" />
  </Svg>
);

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M1.6 8S4.1 3.6 8 3.6 14.4 8 14.4 8 11.9 12.4 8 12.4 1.6 8 1.6 8Z" />
    <circle cx="8" cy="8" r="1.9" />
  </Svg>
);

export const CheckCircleIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    <path
      d="m5 8.2 2.1 2.1L11 6.4"
      stroke="#fff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WarningIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.1 2.9a1 1 0 0 1 1.8 0l5 9.1a1 1 0 0 1-.9 1.5H3a1 1 0 0 1-.9-1.5l5-9.1Z" />
    <path d="M8 6.4v3M8 11.4h.01" />
  </Svg>
);

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.6v6.8M5.3 7 8 9.7 10.7 7" />
    <path d="M2.8 11.6v1a.8.8 0 0 0 .8.8h8.8a.8.8 0 0 0 .8-.8v-1" />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 10.2V2.8M5.4 5.4 8 2.8l2.6 2.6" />
    <path d="M2.8 9.6v3a.8.8 0 0 0 .8.8h8.8a.8.8 0 0 0 .8-.8v-3" />
  </Svg>
);

export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.8" y="3" width="12.4" height="10" rx="1.6" />
    <path d="m6.4 7-1.5 1.5L6.4 10M9.6 7l1.5 1.5L9.6 10" />
  </Svg>
);

export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 5h4M9.5 5h4M2.5 11h2M7.5 11h6" />
    <circle cx="8" cy="5" r="1.5" />
    <circle cx="6" cy="11" r="1.5" />
  </Svg>
);

export const MegaphoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6.5v3a1 1 0 0 0 1 1h1.6L11 13.2V2.8L5.6 5.5H4a1 1 0 0 0-1 1Z" />
    <path d="M13 6.2a2.4 2.4 0 0 1 0 3.6" />
  </Svg>
);

export const MarkdownIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.4" />
    <path d="M4 10.4V5.6L6 8l2-2.4v4.8M11 5.6v4.8M9.6 9l1.4 1.4L12.4 9" />
  </Svg>
);

export const BracesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.2 2.5c-1.4 0-1.7.9-1.7 2v1.3c0 1.1-.6 1.6-1.5 1.6v1.2c.9 0 1.5.5 1.5 1.6v1.3c0 1.1.3 2 1.7 2" />
    <path d="M9.8 2.5c1.4 0 1.7.9 1.7 2v1.3c0 1.1.6 1.6 1.5 1.6v1.2c-.9 0-1.5.5-1.5 1.6v1.3c0 1.1-.3 2-1.7 2" />
  </Svg>
);

export const ChatIcon = ({ size = 20, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 2.2c-4.3 0-7.8 2.9-7.8 6.5 0 2 1.1 3.8 2.8 5-.1 1-.6 2.2-1.5 3.2 1.8-.2 3.3-1 4.3-1.8.7.1 1.4.2 2.2.2 4.3 0 7.8-2.9 7.8-6.6S14.3 2.2 10 2.2Z" />
  </svg>
);

/** Firecrawl's flame mark, rebuilt as a single path. */
export const FlameIcon = ({ size = 22, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M13.3 1.6c.5 2.6-.3 4.6-1.8 6.4-1.4 1.7-3.3 3.2-4.6 5.2A7.6 7.6 0 0 0 5.6 17a6.5 6.5 0 0 0 13 .3c0-2.2-.9-3.9-2-5.4-.4 1-1 1.8-1.9 2.2.5-2.6-.2-5-1.5-7-.7-1.1-1.6-2-2.4-3 1.1-.3 2.2-1 2.5-2.5Z" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
);
