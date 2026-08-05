"use client";

import React from "react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="af-empty">
      <div className="af-empty__icon" aria-hidden="true">
        ⌁
      </div>
      <div className="af-empty__text">
        <h1 className="af-h1">{title}</h1>
        {description ? <p className="af-body">{description}</p> : null}
      </div>
      {actionLabel ? (
        <div className="af-empty__actions">
          <button type="button" className="af-primaryLink" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

