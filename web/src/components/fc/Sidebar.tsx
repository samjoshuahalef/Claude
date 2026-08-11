"use client";

import React from "react";
import Link from "next/link";
import { cn } from "./cn";
import { Kbd } from "./Badge";
import { IconButton } from "./Button";
import {
  ChevronLeftIcon,
  CloseIcon,
  DocsIcon,
  FlameIcon,
  HelpIcon,
  HomeIcon,
  InventoryIcon,
  MarketIcon,
  MegaphoneIcon,
  SearchIcon,
  SettingsIcon,
  SourcingIcon,
  ValuationIcon,
  WatchlistIcon,
} from "./Icons";

/**
 * AutoFlair's navigation.
 *
 * Firecrawl's nav (Playground / API Keys / Usage / Activity Logs) served a
 * developer testing endpoints. This user is a dealer deciding what to buy and
 * what to pay, so the sections follow their workflow instead. Usage and API
 * keys move under Settings — account admin, not daily work.
 *
 * Nine stated capabilities collapse to six sections: trends are the time axis
 * on Market, trade-in is a mode of Valuation, and a watch is a saved query
 * plus a notification rule. See PRODUCT.md.
 */

export type NavKey =
  | "overview"
  | "market"
  | "valuation"
  | "sourcing"
  | "inventory"
  | "watchlists"
  | "settings";

type NavEntry = {
  key: NavKey;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const PRIMARY: NavEntry[] = [
  { key: "overview", label: "Overview", href: "/", icon: <HomeIcon /> },
  { key: "market", label: "Market", href: "/market", icon: <MarketIcon /> },
  { key: "valuation", label: "Valuation", href: "/valuation", icon: <ValuationIcon /> },
  { key: "sourcing", label: "Sourcing", href: "/sourcing", icon: <SourcingIcon /> },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: <InventoryIcon /> },
  { key: "watchlists", label: "Watchlists", href: "/watchlists", icon: <WatchlistIcon /> },
];

function NavItem({
  icon,
  label,
  href,
  active,
  trailing,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const classes = cn(
    "flex h-40 w-full cursor-pointer items-center gap-10 rounded-8 pr-10 pl-10 text-label-medium transition",
    active
      ? "bg-heat-8 text-heat-100"
      : "text-black-alpha-64 hover:bg-black-alpha-4 hover:text-accent-black",
  );

  const inner = (
    <>
      {icon ? (
        <span className={cn("shrink-0", active ? "text-heat-100" : "text-black-alpha-40")}>
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </>
  );

  if (!href) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {inner}
    </Link>
  );
}

function Divider() {
  return <div className="my-4 h-1 bg-border-faint" aria-hidden="true" />;
}

export function Sidebar({
  active = "overview",
  onNavigate,
  onClose,
}: {
  active?: NavKey;
  /** Fired when a destination is picked — dismisses the mobile drawer. */
  onNavigate?: () => void;
  /** Fired by the drawer's close button. */
  onClose?: () => void;
}) {
  return (
    <aside
      className="flex w-(--fc-sidebar-width) shrink-0 flex-col border-r-1 border-border-faint bg-accent-white"
      aria-label="Primary"
    >
      <div className="flex h-(--fc-topbar-height) items-center gap-8 px-16">
        <FlameIcon size={24} className="text-heat-100" />
        <span className="flex-1 text-label-x-large tracking-[-0.3px] text-accent-black">
          AutoFlair
        </span>
        <div className="lg:hidden">
          <IconButton label="Close navigation" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </div>
      </div>

      {/*
        The Advisor lives here rather than in the nav. As a destination it
        becomes a chatbot page nobody returns to; as the ⌘K field it is on
        every screen and knows what you are looking at.
      */}
      <div className="px-12 pb-8">
        <button
          type="button"
          className="flex h-40 w-full cursor-pointer items-center gap-10 rounded-8 bg-black-alpha-4 px-10 text-black-alpha-48 transition hover:bg-black-alpha-5"
        >
          <SearchIcon />
          <span className="flex-1 truncate text-left text-label-medium">
            Search or ask anything
          </span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-12">
        {PRIMARY.map((entry) => (
          <NavItem
            key={entry.key}
            icon={entry.icon}
            label={entry.label}
            href={entry.href}
            active={active === entry.key}
            onClick={onNavigate}
          />
        ))}

        <Divider />

        {/* No room for these in the topbar on small screens. */}
        <div className="flex flex-col gap-4 lg:hidden">
          <NavItem icon={<HelpIcon />} label="Help" onClick={onNavigate} />
          <NavItem icon={<DocsIcon />} label="Docs" onClick={onNavigate} />
          <Divider />
        </div>

        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          href="/settings"
          active={active === "settings"}
          onClick={onNavigate}
        />
      </nav>

      <div className="p-12">
        <button
          type="button"
          className="flex w-full cursor-pointer gap-10 rounded-8 border-1 border-heat-16 bg-heat-4 p-12 text-left transition hover:bg-heat-8"
        >
          <span className="mt-2 shrink-0 text-heat-100">
            <MegaphoneIcon />
          </span>
          <span className="flex flex-col gap-2">
            <span className="text-label-medium text-accent-black">
              What&apos;s New <span className="text-heat-100">(6)</span>
            </span>
            <span className="text-body-small text-black-alpha-56">
              View our latest update
            </span>
          </span>
        </button>
      </div>

      <div className="border-t-1 border-border-faint p-12">
        <button
          type="button"
          className="flex h-36 w-full cursor-pointer items-center gap-10 rounded-8 px-8 transition hover:bg-black-alpha-4"
        >
          <span className="flex-center size-24 shrink-0 rounded-6 bg-black-alpha-8 text-label-x-small text-black-alpha-64">
            s
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-label-medium text-black-alpha-72">
            sam@autoflair.ch
          </span>
        </button>
      </div>

      <div className="hidden border-t-1 border-border-faint p-12 lg:block">
        <button
          type="button"
          className="flex h-36 w-full cursor-pointer items-center gap-10 rounded-8 px-8 text-black-alpha-56 transition hover:bg-black-alpha-4 hover:text-accent-black"
        >
          <ChevronLeftIcon />
          <span className="text-label-medium">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
