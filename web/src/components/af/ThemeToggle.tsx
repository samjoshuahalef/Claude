"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Theme control.
 *
 * The document ships with `data-theme="dark"` already set server-side, so there
 * is no flash of the wrong theme on first paint — this only ever switches an
 * already-correct document.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("af-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("af-theme", theme);
  }, [theme]);

  return (
    <button
      className="af-btn af-btn--ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
