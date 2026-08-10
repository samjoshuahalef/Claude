"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";
import {
  AppraiseIcon,
  MarketIcon,
  PerformanceIcon,
  SearchIcon,
  SettingsIcon,
  StockIcon,
  TodayIcon,
} from "./icons";

/**
 * The application shell.
 *
 * Five modules, in the order a dealer's day runs: what needs doing, then the
 * decision they are about to make, then what they own, then what the market is
 * doing, then whether any of it worked. Anything that does not fit one of those
 * five questions does not belong in the product.
 */

export interface NavCounts {
  /** Cars needing action — the only count rendered in accent, because it is a
   *  queue the dealer is expected to clear. */
  actions: number;
  opportunities: number;
  stock: number;
}

const MODULES = [
  { href: "/", label: "Today", Icon: TodayIcon, count: "actions" as const },
  { href: "/appraise", label: "Appraise", Icon: AppraiseIcon, count: null },
  { href: "/stock", label: "Stock", Icon: StockIcon, count: "stock" as const },
  { href: "/market", label: "Market", Icon: MarketIcon, count: null },
  { href: "/performance", label: "Performance", Icon: PerformanceIcon, count: null },
];

export function Shell({ counts, children }: { counts: NavCounts; children: React.ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="shell">
      <header className="mobilebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden />
          Autoflair
        </div>
        <button
          className="btn btn--quiet btn--sm"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </header>

      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden />
          Autoflair
        </div>

        <button className="nav__item" onClick={() => setPaletteOpen(true)}>
          <SearchIcon className="nav__icon" />
          Search
          <span className="kbd" style={{ marginLeft: "auto" }}>
            ⌘K
          </span>
        </button>

        <nav className="nav" aria-label="Modules">
          {MODULES.map(({ href, label, Icon, count }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const value = count ? counts[count] : null;
            return (
              <Link
                key={href}
                href={href}
                className="nav__item"
                aria-current={active ? "page" : undefined}
              >
                <Icon className="nav__icon" />
                {label}
                {value !== null && value > 0 && (
                  <span
                    className={`nav__count${count === "actions" ? " nav__count--action" : ""}`}
                  >
                    {value}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__spacer" />

        <div className="sidebar__foot">
          <span className="nav__item" style={{ cursor: "default" }}>
            <SettingsIcon className="nav__icon" />
            Bergmann Automobile
          </span>
        </div>
      </aside>

      <main className="main">{children}</main>

      {/* Phone navigation. Rendered always and revealed by CSS rather than by a
          breakpoint hook, so the first paint is correct on a phone instead of
          flashing the desktop layout and then correcting itself. */}
      <nav className="tabbar" aria-label="Modules">
        {MODULES.map(({ href, label, Icon, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const value = count ? counts[count] : null;
          return (
            <Link
              key={href}
              href={href}
              className="tabbar__item"
              aria-current={active ? "page" : undefined}
            >
              <span className="tabbar__icon">
                <Icon />
                {count === "actions" && value !== null && value > 0 && (
                  <span className="tabbar__badge">{value}</span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
