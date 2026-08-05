"use client";

import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "md" | "lg";
};

export function Card({ children, className, padding = "lg" }: CardProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "md"
        ? "af-card--pad-md"
        : "af-card--pad-lg";

  return (
    <section className={["af-card", paddingClass, className].join(" ")}>
      {children}
    </section>
  );
}

