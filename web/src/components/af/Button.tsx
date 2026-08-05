"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  loading,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = "button",
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        "af-btn",
        `af-btn--${variant}`,
        `af-btn--${size}`,
        (disabled || loading) && "af-btn--disabled",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="af-spinner" aria-hidden="true" />
      ) : (
        <>
          {leftIcon ? <span className="af-btn__icon">{leftIcon}</span> : null}
          <span className="af-btn__label">{children}</span>
          {rightIcon ? (
            <span className="af-btn__icon">{rightIcon}</span>
          ) : null}
        </>
      )}
    </button>
  );
}

