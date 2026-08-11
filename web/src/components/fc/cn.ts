/** Tiny class joiner. Falsy entries drop out. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
