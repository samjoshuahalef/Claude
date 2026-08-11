import React from "react";
import { cn } from "./cn";

/**
 * Minimal JSON colouring matching the MCP snippet on the Overview page:
 * keys stay near-black, string values go heat, punctuation recedes.
 */
function highlight(line: string, lineIndex: number) {
  const tokens = line.match(/("(?:[^"\\]|\\.)*"\s*:?)|([{}[\],])|([^"{}[\],]+)/g);
  if (!tokens) return line;

  return tokens.map((token, index) => {
    const key = `${lineIndex}-${index}`;

    if (token.startsWith('"')) {
      const isKey = token.trimEnd().endsWith(":");
      return (
        <span
          key={key}
          className={isKey ? "text-black-alpha-88" : "text-heat-100"}
        >
          {token}
        </span>
      );
    }

    if (/^[{}[\],]$/.test(token)) {
      return (
        <span key={key} className="text-black-alpha-40">
          {token}
        </span>
      );
    }

    return (
      <span key={key} className="text-black-alpha-72">
        {token}
      </span>
    );
  });
}

export function CodeBlock({
  code,
  language = "json",
  showLineNumbers = false,
  className,
}: {
  code: string;
  language?: "json" | "text" | "markdown";
  showLineNumbers?: boolean;
  className?: string;
}) {
  const lines = code.split("\n");

  return (
    <pre
      className={cn(
        "no-scrollbar overflow-x-auto font-mono text-mono-small",
        className,
      )}
    >
      <code>
        {lines.map((line, index) => (
          <div key={index} className="flex gap-16">
            {showLineNumbers ? (
              <span className="w-24 shrink-0 text-right text-black-alpha-24 select-none">
                {index + 1}
              </span>
            ) : null}
            <span className="whitespace-pre">
              {language === "json" ? highlight(line, index) : line}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}
