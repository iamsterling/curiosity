"use client";

import { useState } from "react";

export function CopyCommand({
  command,
  className
}: {
  command: string;
  className?: string;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (non-secure context) — no-op; the command stays
      // readable and selectable either way.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy: ${command}`}
      className={`c-copy-command${className ? ` ${className}` : ""}`}
    >
      <span className="c-copy-command-prompt">$</span>
      <span className="c-copy-command-text">{command}</span>
      <span className="c-copy-command-chip" aria-hidden>
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </span>
    </button>
  );
}
