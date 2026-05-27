"use client";

import { usePrivy } from "@privy-io/react-auth";

type Props = {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
};

export function ConnectButton({ variant = "primary", className = "", label }: Props) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <span
        className="chip chip-mono"
        style={{ background: "var(--surface-1)", padding: "8px 14px", opacity: 0.6 }}
      >
        Loading…
      </span>
    );
  }

  if (authenticated) {
    const addr = user?.wallet?.address;
    const short = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "Connected";
    return (
      <button
        onClick={() => logout()}
        className={`chip chip-mono ${className}`}
        style={{ background: "var(--surface-1)", padding: "8px 14px", cursor: "pointer", border: 0 }}
        title="Sign out"
      >
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ok)" }}
        />
        {short}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        onClick={() => login()}
        className={`btn btn-sm btn-ghost ${className}`}
      >
        {label ?? "Sign in"}
      </button>
    );
  }

  return (
    <button
      onClick={() => login()}
      className={`btn btn-plum ${className}`}
    >
      {label ?? "Sign in"}
    </button>
  );
}
