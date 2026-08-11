import React from "react";
import { Sidebar, type NavKey } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatIcon } from "./Icons";

/**
 * Sidebar + topbar frame. The main column is a hairline-bordered grid
 * inset from the canvas by 24px on each side, which is what gives every
 * Firecrawl page its "sheet of graph paper" reading.
 */
export function AppShell({
  active,
  children,
}: {
  active?: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-base">
      <Sidebar active={active} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-24 pb-64">
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
    <div className="fixed right-24 bottom-24 z-50">
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
