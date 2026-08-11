"use client";

import React from "react";
import { Button, IconButton } from "./Button";
import {
  BellIcon,
  ChevronDownIcon,
  DocsIcon,
  HelpIcon,
  UpgradeIcon,
} from "./Icons";

export function Topbar({
  team = "Personal Team",
  notifications = 0,
}: {
  team?: string;
  notifications?: number;
}) {
  return (
    <header className="flex h-(--fc-topbar-height) shrink-0 items-center justify-between gap-16 px-24">
      <button
        type="button"
        className="flex h-36 cursor-pointer items-center gap-8 rounded-8 border-1 border-border-faint bg-accent-white px-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-border-loud"
      >
        <span className="flex-center size-20 shrink-0 rounded-4 bg-heat-100 text-label-x-small text-accent-white">
          {team.charAt(0).toUpperCase()}
        </span>
        <span className="text-label-medium text-accent-black">{team}</span>
        <span className="text-black-alpha-40">
          <ChevronDownIcon size={14} />
        </span>
      </button>

      <div className="flex items-center gap-8">
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

        <Button iconLeft={<HelpIcon />}>Help</Button>
        <Button iconLeft={<DocsIcon />}>Docs</Button>
        <Button variant="primary" iconLeft={<UpgradeIcon />}>
          Upgrade
        </Button>
      </div>
    </header>
  );
}
