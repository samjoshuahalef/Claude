/**
 * Severity, encoded redundantly.
 *
 * Shape and colour together, never colour alone — roughly one man in twelve has
 * a red-green deficiency, and in an automotive context red already means "loss"
 * elsewhere on the same screen. A filled triangle is act now, a filled dot is
 * watch, a hollow dot is fine.
 *
 * Three states, deliberately. Beyond three, severity levels add confusion
 * without changing what anybody does.
 */

interface Props {
  tone: "neg" | "warn" | "pos" | "calm";
  label: string;
}

export function Severity({ tone, label }: Props) {
  return (
    <span className={`queue__sev queue__sev--${tone}`} role="img" aria-label={label}>
      {tone === "neg" ? (
        <svg width="11" height="10" viewBox="0 0 11 10" aria-hidden>
          <path d="M5.5 0 11 10H0z" fill="currentColor" />
        </svg>
      ) : tone === "warn" ? (
        <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
          <circle cx="4.5" cy="4.5" r="4.5" fill="currentColor" />
        </svg>
      ) : (
        <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
          <circle cx="4.5" cy="4.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )}
    </span>
  );
}
