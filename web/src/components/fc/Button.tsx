import React from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "small" | "medium" | "large";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
};

const sizes: Record<ButtonSize, string> = {
  small: "h-32 px-10 gap-6 text-label-small rounded-6",
  medium: "h-36 px-12 gap-8 text-label-medium rounded-8",
  large: "h-40 px-16 gap-8 text-label-medium rounded-8",
};

const variants: Record<ButtonVariant, string> = {
  // Heat fill. The only saturated surface in the product — one per view.
  primary: "bg-heat-100 text-accent-white hover:brightness-95",
  // The dashboard's workhorse: white chip on the grey canvas.
  secondary:
    "bg-accent-white text-accent-black border-1 border-border-faint shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-background-lighter hover:border-border-loud",
  tertiary: "text-black-alpha-64 hover:bg-black-alpha-4 hover:text-accent-black",
  danger: "bg-accent-crimson text-accent-white hover:brightness-95",
};

export function Button({
  variant = "secondary",
  size = "medium",
  iconLeft,
  iconRight,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap transition select-none",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="size-14 animate-spin-fc rounded-full border-2 border-current border-t-transparent opacity-60"
          aria-hidden="true"
        />
      ) : (
        iconLeft
      )}
      {children}
      {iconRight}
    </button>
  );
}

/** Square icon-only button, used for the copy / reveal affordances. */
export function IconButton({
  className,
  children,
  label,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex-center size-32 shrink-0 cursor-pointer rounded-6 text-black-alpha-56 transition",
        "hover:bg-black-alpha-4 hover:text-accent-black active:scale-[0.98]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
