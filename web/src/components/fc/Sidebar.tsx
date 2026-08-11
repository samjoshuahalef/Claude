"use client";

import React from "react";
import { cn } from "./cn";
import { Kbd } from "./Badge";
import { IconButton } from "./Button";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  CloseIcon,
  DocsIcon,
  ExtractIcon,
  FlameIcon,
  HelpIcon,
  HomeIcon,
  KeyIcon,
  LogsIcon,
  MegaphoneIcon,
  PlayIcon,
  SearchIcon,
  SettingsIcon,
  UsageIcon,
} from "./Icons";

export type NavKey =
  | "overview"
  | "playground"
  | "extract"
  | "extract-overview"
  | "extract-playground"
  | "logs"
  | "usage"
  | "keys"
  | "settings";

function NavItem({
  icon,
  label,
  active,
  trailing,
  indented,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  trailing?: React.ReactNode;
  indented?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-40 w-full cursor-pointer items-center gap-10 rounded-8 pr-10 text-label-medium transition",
        indented ? "pl-38" : "pl-10",
        active
          ? "bg-heat-8 text-heat-100"
          : "text-black-alpha-64 hover:bg-black-alpha-4 hover:text-accent-black",
      )}
    >
      {icon ? (
        <span className={cn("shrink-0", active ? "text-heat-100" : "text-black-alpha-40")}>
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </button>
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
  const [extractOpen, setExtractOpen] = React.useState(
    active.startsWith("extract"),
  );

  return (
    <aside
      className="flex w-(--fc-sidebar-width) shrink-0 flex-col border-r-1 border-border-faint bg-accent-white"
      aria-label="Primary"
    >
      <div className="flex h-(--fc-topbar-height) items-center gap-8 px-16">
        <FlameIcon size={24} className="text-heat-100" />
        <span className="flex-1 text-label-x-large tracking-[-0.3px] text-accent-black">
          Firecrawl
        </span>
        <div className="lg:hidden">
          <IconButton label="Close navigation" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </div>
      </div>

      <div className="px-12 pb-8">
        <button
          type="button"
          className="flex h-40 w-full cursor-pointer items-center gap-10 rounded-8 bg-black-alpha-4 px-10 text-black-alpha-48 transition hover:bg-black-alpha-5"
        >
          <SearchIcon />
          <span className="flex-1 text-left text-label-medium">Search</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-12">
        <NavItem
          icon={<HomeIcon />}
          label="Overview"
          active={active === "overview"}
          onClick={onNavigate}
        />
        <NavItem
          icon={<PlayIcon />}
          label="Playground"
          active={active === "playground"}
          onClick={onNavigate}
        />

        <NavItem
          icon={<ExtractIcon />}
          label="Extract"
          active={active === "extract"}
          onClick={() => setExtractOpen((open) => !open)}
          trailing={
            <span
              className={cn(
                "text-black-alpha-32 transition-transform",
                extractOpen && "rotate-180",
              )}
            >
              <ChevronDownIcon size={14} />
            </span>
          }
        />
        {extractOpen ? (
          <div className="flex flex-col gap-4">
            <NavItem
              label="Overview"
              indented
              active={active === "extract-overview"}
              onClick={onNavigate}
            />
            <NavItem
              label="Playground"
              indented
              active={active === "extract-playground"}
              onClick={onNavigate}
            />
          </div>
        ) : null}

        <Divider />

        <div className="flex flex-col gap-4 lg:hidden">
          <NavItem icon={<HelpIcon />} label="Help" onClick={onNavigate} />
          <NavItem icon={<DocsIcon />} label="Docs" onClick={onNavigate} />
          <Divider />
        </div>

        <NavItem
          icon={<LogsIcon />}
          label="Activity Logs"
          active={active === "logs"}
          onClick={onNavigate}
        />
        <NavItem
          icon={<UsageIcon />}
          label="Usage"
          active={active === "usage"}
          onClick={onNavigate}
        />
        <NavItem
          icon={<KeyIcon />}
          label="API Keys"
          active={active === "keys"}
          onClick={onNavigate}
        />
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
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
              What&apos;s New{" "}
              <span className="text-heat-100">(6)</span>
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
            samlee@content-mobbin.com
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
