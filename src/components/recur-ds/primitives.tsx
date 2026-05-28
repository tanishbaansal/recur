"use client";

import type { ReactNode } from "react";

// ── Chain logos (tiny abstract glyphs, from design) ─────────────────
export const ChainLogo = ({ name, size = 16 }: { name: string; size?: number }) => {
  let norm = name.toLowerCase().replace("sepolia", "").trim();
  if (norm === "arbitrum") {
    return (
      <img
        src="/arb.svg"
        width={size}
        height={size}
        style={{ borderRadius: "50%", display: "block" }}
        alt="Arbitrum"
      />
    );
  }
  const map: Record<string, { bg: string; glyph: ReactNode }> = {
    base: {
      bg: "#0052FF",
      glyph: <circle cx="12" cy="12" r="7" fill="#FAF7F2" />,
    },
    arbitrum: {
      bg: "#28A0F0",
      glyph: <path d="M12 5l5 12h-3l-1-3h-5l2-5 1 3h2L12 5z" fill="#FAF7F2" />,
    },
    optimism: {
      bg: "#FF0420",
      glyph: <circle cx="9" cy="12" r="3" fill="#FAF7F2" />,
    },
    polygon: {
      bg: "#8247E5",
      glyph: <path d="M6 9l4-2 4 2v4l-4 2-4-2zm8 2l4-2 0 4-4 2z" fill="#FAF7F2" />,
    },
    avalanche: {
      bg: "#E84142",
      glyph: <path d="M12 5l6 12H6z" fill="#FAF7F2" />,
    },
    ethereum: {
      bg: "#627EEA",
      glyph: (
        <path
          d="M12 4v6l4 2-4-8zm0 6v6l-4-4 4-2zm0 6l4-4-4 8v-4zm-4-4l4 4v-4l-4-4z"
          fill="#FAF7F2"
        />
      ),
    },
  };
  norm = name.toLowerCase().replace("sepolia", "");
  const m = map[norm] ?? { bg: "#999", glyph: null };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill={m.bg} />
      {m.glyph}
    </svg>
  );
};

export const USDCCoin = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="12" fill="#2775CA" />
    <path
      d="M12 5.5v.9c2.4.3 4 2 4 4.1 0 2.3-1.7 3.7-4.1 4-.3 0-.4.2-.4.5v1.5c0 .3.1.4.4.4 3.7-.3 6.6-3.3 6.6-7 0-3.4-2.5-6.2-6-6.7-.3 0-.5.2-.5.5v.8z"
      fill="#fff"
      opacity=".95"
    />
    <path
      d="M12 18.5v-.9c-2.4-.3-4-2-4-4.1 0-2.3 1.7-3.7 4.1-4 .3 0 .4-.2.4-.5V7.5c0-.3-.1-.4-.4-.4-3.7.3-6.6 3.3-6.6 7 0 3.4 2.5 6.2 6 6.7.3 0 .5-.2.5-.5v-.8z"
      fill="#fff"
      opacity=".95"
    />
    <text
      x="12"
      y="14.5"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="#2775CA"
      fontFamily="ui-sans-serif"
    >
      $
    </text>
  </svg>
);

// ── Chip primitives ──────────────────────────────────────────────────
export const ChainChip = ({
  name,
  label,
  size = 13,
}: {
  name: string;
  label?: string;
  size?: number;
}) => {
  const display = label ?? prettyChain(name);
  return (
    <span
      className="chip"
      style={{ background: "var(--surface-1)", padding: "5px 11px 5px 6px", fontSize: size }}
    >
      <ChainLogo name={name} size={18} />
      <span>{display}</span>
    </span>
  );
};

export const TokenChip = ({ amt = "10", sym = "USDC" }: { amt?: string; sym?: string }) => (
  <span
    className="chip"
    style={{ background: "var(--surface-1)", padding: "5px 11px 5px 6px" }}
  >
    <USDCCoin size={18} />
    <span className="t-mono">
      {amt} {sym}
    </span>
  </span>
);

type StatusKind = "pending" | "filled" | "skipped" | "failed" | "armed";

export const StatusChip = ({ kind = "pending" }: { kind?: StatusKind }) => {
  const map: Record<
    StatusKind,
    { bg: string; fg: string; dot: string; label: string }
  > = {
    pending: { bg: "var(--butter)", fg: "#5b4716", dot: "#9a7c2a", label: "Pending" },
    filled: { bg: "var(--sage)", fg: "#2d3f29", dot: "#3a5a35", label: "Filled" },
    skipped: { bg: "var(--plum)", fg: "#F6EFE5", dot: "#F6EFE5", label: "Skipped · alive" },
    failed: { bg: "#E0B0A6", fg: "#5a2519", dot: "#7a2e1f", label: "Failed" },
    armed: { bg: "var(--ink)", fg: "#F6EFE5", dot: "#F5D87A", label: "Armed" },
  };
  const m = map[kind];
  return (
    <span
      className="chip"
      style={{ background: m.bg, color: m.fg, padding: "5px 12px", fontWeight: 500 }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: m.dot,
          display: "inline-block",
          marginRight: 2,
        }}
      />
      {m.label}
    </span>
  );
};

export type TypeKind = "subscription" | "dca" | "payroll" | "lastwill";

export const TypeBadge = ({ kind = "subscription" }: { kind?: TypeKind }) => {
  const map: Record<TypeKind, { c: string; bg: string; label: string }> = {
    subscription: { c: "var(--rose-d)", bg: "#F4D4CB", label: "Subscription" },
    dca: { c: "#8b6c14", bg: "var(--butter)", label: "DCA" },
    payroll: { c: "#3a5a35", bg: "var(--sage)", label: "Payroll" },
    lastwill: { c: "#F6EFE5", bg: "var(--plum)", label: "Last Will" },
  };
  const m = map[kind];
  return (
    <span
      className="chip"
      style={{
        background: m.bg,
        color: m.c,
        padding: "5px 12px",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: ".02em",
        textTransform: "uppercase",
      }}
    >
      {m.label}
    </span>
  );
};

// ── Live fire row (Streamflix + DCA) ─────────────────────────────────
export const LiveFireRow = ({
  stage = 3,
  dstLabel = "Arbitrum",
}: {
  stage?: 1 | 2 | 3;
  dstLabel?: string;
}) => {
  const steps = [
    { c: "var(--butter)", ic: "⏳", l: "Submitting intent", t: "0.0s" },
    { c: "var(--sage)", ic: "🌉", l: "Solver matched · 0xSolverAlpha…", t: "2.4s" },
    {
      c: "var(--sage-d)",
      ic: "✓",
      l: `Fill on ${dstLabel} · 0xfill1ab…`,
      t: "22s · settled",
    },
  ];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 18px",
            background: "var(--surface-1)",
            borderRadius: 14,
            opacity: i < stage ? 1 : 0.3,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: s.c,
              color: i === 2 ? "#F6EFE5" : "#1A1410",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {s.ic}
          </span>
          <span style={{ flex: 1, fontFamily: "var(--f-mono)", fontSize: 13 }}>{s.l}</span>
          <span
            style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--text-2)" }}
          >
            {s.t}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────
function prettyChain(name: string): string {
  const norm = name.toLowerCase();
  if (norm.includes("base")) return norm.includes("sepolia") ? "Base Sepolia" : "Base";
  if (norm.includes("arbitrum"))
    return norm.includes("sepolia") ? "Arbitrum Sepolia" : "Arbitrum";
  if (norm.includes("optimism"))
    return norm.includes("sepolia") ? "Optimism Sepolia" : "Optimism";
  if (norm === "sepolia") return "Sepolia";
  return name[0].toUpperCase() + name.slice(1);
}

// Map demo-route slug → TypeBadge kind
export function badgeKindForTheme(theme?: string, type?: string): TypeKind {
  if (theme === "streamflix") return "subscription";
  if (theme === "payroll") return "payroll";
  if (theme === "dca" || type === "dca") return "dca";
  if (theme === "heir" || type === "deadmans") return "lastwill";
  return "subscription";
}
