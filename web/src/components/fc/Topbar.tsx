"use client";

import React from "react";
import { Button, IconButton } from "./Button";
import {
  BellIcon,
  ChevronDownIcon,
  DocsIcon,
  HelpIcon,
  MenuIcon,
  UpgradeIcon,
} from "./Icons";

export function Topbar({
  team = "Personal Team",
  notifications = 0,
  onMenuClick,
}: {
  team?: string;
  notifications?: number;
  onMenuClick?: () => void;
}) {
  return (
    <header className="flex h-(--fc-topbar-height) shrink-0 items-center justify-between gap-8 px-16 sm:px-24">
      <div className="flex min-w-0 items-center gap-8">
        <div className="lg:hidden">
          <IconButton label="Open navigation" onClick={onMenuClick}>
            <MenuIcon size={18} />
          </IconButton>
        </div>

        <button
          type="button"
          className="flex h-36 min-w-0 cursor-pointer items-center gap-8 rounded-8 border-1 border-border-faint bg-accent-white px-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-border-loud"
        >
          <span className="flex-center size-20 shrink-0 rounded-4 bg-heat-100 text-label-x-small text-accent-white">
            {team.charAt(0).toUpperCase()}
          </span>
          {/* The team name is the first thing to go when width runs out. */}
          <span className="hidden truncate text-label-medium text-accent-black xs:inline">
            {team}
          </span>
          <span className="shrink-0 text-black-alpha-40">
            <ChevronDownIcon size={14} />
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-8">
        <div className="flex items-center gap-6">
          <IconButton label="Notifications">
            <BellIcon />
          </IconButton>
          {notifications > 0 ? (
            <span className="flex-center size-20 rounded-full bg-heat-100 text-label-x-small text-accent-white">
              {notifications}
            </span>
          ) : null}
        </div>

        {/* Help and Docs are reachable from the drawer on small screens. */}
        <div className="hidden items-center gap-8 lg:flex">
          <Button iconLeft={<HelpIcon />}>Help</Button>
          <Button iconLeft={<DocsIcon />}>Docs</Button>
        </div>

        <Button variant="primary" iconLeft={<UpgradeIcon />}>
          Upgrade
        </Button>
      </div>
    </header>
  );
}
