"use client";

import React from "react";
import { Sidebar, type NavKey } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatIcon } from "./Icons";
import { cn } from "./cn";

/**
 * Sidebar + topbar frame. The main column is a hairline-bordered grid
 * inset from the canvas, which is what gives every Firecrawl page its
 * "sheet of graph paper" reading.
 *
 * Below `lg` (996px — Firecrawl's breakpoint, not Tailwind's) the sidebar
 * leaves the flow and becomes an off-canvas drawer. Firecrawl's own mobile
 * dashboard is not in the reference material, so this is an extension built
 * from the system's vocabulary rather than a 1:1 copy. See DESIGN.md.
 */
export function AppShell({
  active,
  children,
}: {
  active?: NavKey;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);

  // Escape closes the drawer, and the page behind it must not scroll.
  React.useEffect(() => {
    if (!navOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-base">
      {/* Backdrop — mobile only, and only while the drawer is open. */}
      <div
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black-alpha-32 transition-opacity lg:hidden",
          navOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex transition-transform lg:static lg:z-auto lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          active={active}
          onNavigate={() => setNavOpen(false)}
          onClose={() => setNavOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setNavOpen(true)} />

        <main className="flex-1 overflow-y-auto px-16 pb-64 sm:px-24">
          <div className="mx-auto max-w-1200 border-x-1 border-border-faint">
            {children}
          </div>
        </main>
      </div>

      <SupportBubble unread={2} />
    </div>
  );
}

function SupportBubble({ unread }: { unread?: number }) {
  return (
    <div className="fixed right-16 bottom-16 z-30 sm:right-24 sm:bottom-24">
      <button
        type="button"
        aria-label="Open support chat"
        className="flex-center size-52 cursor-pointer rounded-full bg-heat-100 text-accent-white shadow-[0_4px_16px_rgba(250,93,25,0.32)] transition hover:brightness-95 active:scale-[0.96]"
      >
        <ChatIcon size={22} />
      </button>
      {unread ? (
        <span className="flex-center absolute -top-4 -right-4 size-20 rounded-full bg-accent-crimson text-label-x-small text-accent-white">
          {unread}
        </span>
      ) : null}
    </div>
  );
}
