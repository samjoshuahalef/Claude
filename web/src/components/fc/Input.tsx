import React from "react";
import { cn } from "./cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: React.ReactNode;
  addonRight?: React.ReactNode;
  /** Static prefix rendered inside the field, e.g. the `https://` on the Playground. */
  prefix?: string;
};

export function Input({
  iconLeft,
  addonRight,
  prefix,
  className,
  ...rest
}: InputProps) {
  return (
    <div
      className={cn(
        "group flex h-36 items-center gap-8 rounded-8 border-1 border-border-faint bg-accent-white px-10",
        "transition focus-within:border-heat-40",
        className,
      )}
    >
      {iconLeft ? (
        <span className="shrink-0 text-black-alpha-48">{iconLeft}</span>
      ) : null}
      {prefix ? (
        <span className="shrink-0 font-mono text-mono-small text-black-alpha-40">
          {prefix}
        </span>
      ) : null}
      <input
        className="min-w-0 flex-1 bg-transparent text-body-medium text-accent-black outline-none placeholder:text-black-alpha-40"
        {...rest}
      />
      {addonRight}
    </div>
  );
}
