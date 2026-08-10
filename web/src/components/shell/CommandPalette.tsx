"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Command palette.
 *
 * Its real job is to teach shortcuts, so every command displays its own
 * keystroke — a dealer should graduate from "open, type, enter" to pressing the
 * key directly. It augments the sidebar; it never replaces it.
 */

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
}

const COMMANDS: Command[] = [
  { id: "today", group: "Navigate", label: "Today", hint: "G T", href: "/" },
  { id: "appraise", group: "Navigate", label: "Appraise a vehicle", hint: "G A", href: "/appraise" },
  { id: "stock", group: "Navigate", label: "Stock", hint: "G S", href: "/stock" },
  { id: "market", group: "Navigate", label: "Market", hint: "G M", href: "/market" },
  { id: "performance", group: "Navigate", label: "Performance", hint: "G P", href: "/performance" },
  { id: "new", group: "Actions", label: "New appraisal", hint: "N", href: "/appraise" },
  { id: "reprice", group: "Actions", label: "Review cars needing a price change", href: "/stock" },
  { id: "opps", group: "Actions", label: "Show buying opportunities", href: "/" },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return COMMANDS;
    // Subsequence matching, so "apv" finds "Appraise a vehicle".
    return COMMANDS.filter((command) => {
      const haystack = command.label.toLowerCase();
      let cursor = 0;
      for (const character of needle) {
        cursor = haystack.indexOf(character, cursor);
        if (cursor === -1) return false;
        cursor += 1;
      }
      return true;
    });
  }, [query]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  function run(command: Command | undefined) {
    if (!command) return;
    router.push(command.href);
    onClose();
  }

  const groups = results.reduce<Record<string, Command[]>>((acc, command) => {
    (acc[command.group] ??= []).push(command);
    return acc;
  }, {});

  return (
    <div
      className="cmdk__scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cmdk">
        <input
          ref={inputRef}
          className="cmdk__input"
          placeholder="Search or jump to…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIndex((i) => Math.min(i + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              run(results[index]);
            }
          }}
        />

        <div className="cmdk__list">
          {results.length === 0 && (
            <p className="t-sm" style={{ padding: "var(--s4)" }}>
              Nothing matches “{query}”.
            </p>
          )}

          {Object.entries(groups).map(([group, commands]) => (
            <div key={group}>
              <p className="cmdk__group">{group}</p>
              {commands.map((command) => {
                const position = results.indexOf(command);
                return (
                  <button
                    key={command.id}
                    className="cmdk__item"
                    data-active={position === index}
                    onMouseEnter={() => setIndex(position)}
                    onClick={() => run(command)}
                  >
                    {command.label}
                    {command.hint && <span className="kbd cmdk__item-hint">{command.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
