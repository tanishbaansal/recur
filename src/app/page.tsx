"use client";

import { useState } from "react";
import { TopBar, FooterStrip } from "@/components/recur-ds/Nav";
import { DemoCardCompact, type DemoKind } from "@/components/recur-ds/DemoCard";

const DEMOS: Array<{
  kind: DemoKind;
  href: string;
  title: string;
  desc: string;
  bg: string;
  ink: string;
}> = [
  {
    kind: "streamflix",
    href: "/demo/streamflix",
    title: "Streamflix",
    desc: "Subscribe with USDC on Base. Watch on Arbitrum. Auto-renews for 12 months.",
    bg: "#E8A89B",
    ink: "#2A1612",
  },
  {
    kind: "payroll",
    href: "/demo/payroll",
    title: "Payroll",
    desc: "Pay 5 teammates on 5 different chains from one deposit.",
    bg: "#A8B9A3",
    ink: "#1C2A1A",
  },
  {
    kind: "dca",
    href: "/demo/dca",
    title: "Recur Stack",
    desc: "DCA into ETH every Friday. 52 buys. 0 gas. 1 signature batch.",
    bg: "#F2D26A",
    ink: "#3A2D08",
  },
  {
    kind: "heir",
    href: "/demo/heir",
    title: "Last Will",
    desc: "Pre-signed inheritance. Fires only if you stop checking in.",
    bg: "#231B27",
    ink: "#F4ECDA",
  },
];

export default function Home() {
  const [liveOpen, setLiveOpen] = useState(false);

  return (
    <div
      className="paper-grain"
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily: "var(--f-ui)",
        color: "#1A1410",
      }}
    >
      <TopBar />

      {/* HERO */}
      <section style={{ padding: "72px 80px 56px", textAlign: "center", position: "relative" }}>
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(31,26,20,.05)",
            color: "#1A1410",
            padding: "9px 18px 9px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "inset 0 0 0 1px rgba(31,26,20,.06)",
            animation: "recurChipFloat 3.6s ease-in-out infinite",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "relative",
              width: 9,
              height: 9,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "var(--rose-d)",
                animation: "recurPulse 1.8s ease-in-out infinite",
              }}
            />
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "var(--rose-d)",
              }}
            />
          </span>
          A new way to send money on a schedule
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(105deg, transparent 30%, rgba(255,255,255,.65) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "recurShine 4.2s ease-in-out infinite",
            }}
          />
        </span>

        <h1
          className="t-display"
          style={{
            fontSize: "clamp(64px, 9vw, 120px)",
            lineHeight: 0.95,
            letterSpacing: "-.04em",
            margin: "24px auto 0",
            maxWidth: 1180,
            color: "#1A1410",
          }}
        >
          Deposit once.
          <br />
          <span className="t-display-it">Pay anywhere, gasless.</span>
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "#5a4f44",
            lineHeight: 1.5,
            maxWidth: 680,
            margin: "28px auto 0",
          }}
        >
          Recur is the cozy little primitive for cross-chain recurring payments.
          <br />
          Powered by LI.FI Intents &amp; The Compact resource lock.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginTop: 36,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/app"
            className="btn btn-lg"
            style={{ background: "#E8A89B", color: "#1A1410", fontWeight: 600 }}
          >
            Launch app →
          </a>
          <a
            href="https://www.youtube.com/watch?v=eTXVBZZcWpY"
            target="_blank"
            rel="noreferrer"
            className="btn btn-lg"
            style={{
              background: "var(--bg)",
              color: "#1A1410",
              boxShadow: "inset 0 0 0 1.5px rgba(31,26,20,.12)",
              textDecoration: "underline",
              textDecorationThickness: "1.5px",
              textUnderlineOffset: "4px",
            }}
          >
            Watch demo
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 8 }}>
            <div style={{ display: "flex" }}>
              {["#A8B9A3", "#F2D26A", "#E8A89B", "#231B27"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: c,
                    border: "2.5px solid var(--bg)",
                    marginLeft: i ? -10 : 0,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 14, color: "#5a4f44" }}>wallet built in</span>
          </div>
        </div>
      </section>

      {/* DEMO CARDS */}
      <section id="demos" style={{ padding: "40px 80px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {DEMOS.map((d) => (
            <DemoCardCompact key={d.kind} d={d} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "40px 80px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {[
            {
              n: "01",
              t: "Deposit",
              d: "Lock USDC on Base. One transaction, one approval — done.",
            },
            {
              n: "02",
              t: "Sign N intents",
              d: "Pre-sign every future payout in a single batch. Your wallet, your keys.",
            },
            {
              n: "03",
              t: "Solvers fill",
              d: "A keeper fires each on schedule. Solvers settle on the destination chain.",
            },
          ].map((s, i) => (
            <HowStep
              key={s.n}
              n={s.n}
              t={s.t}
              d={s.d}
              onClick={() => i === 2 && setLiveOpen((o) => !o)}
            />
          ))}
        </div>
        {liveOpen ? <LiveFireInline onClose={() => setLiveOpen(false)} /> : null}
      </section>

      <FooterStrip />
    </div>
  );
}

function HowStep({
  n,
  t,
  d,
  onClick,
}: {
  n: string;
  t: string;
  d: string;
  onClick: () => void;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        textAlign: "left",
        border: 0,
        background: "rgba(31,26,20,.04)",
        padding: "22px 24px",
        borderRadius: 24,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 18,
        transform: h ? "translateY(-2px)" : "translateY(0)",
        boxShadow: h ? "0 12px 28px rgba(31,26,20,.08)" : "none",
        transition: "transform .25s, box-shadow .25s, background .15s",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: h ? "#231B27" : "var(--bg)",
          color: h ? "#F4ECDA" : "#1A1410",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--f-display)",
          fontStyle: "italic",
          fontSize: 18,
          transition: "background .2s, color .2s",
          boxShadow: h ? "none" : "inset 0 0 0 1px rgba(31,26,20,.08)",
        }}
      >
        {n}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1410" }}>{t}</div>
        <div style={{ fontSize: 14, color: "#5a4f44", marginTop: 2, lineHeight: 1.5 }}>{d}</div>
      </div>
    </button>
  );
}

function LiveFireInline({ onClose }: { onClose: () => void }) {
  const rows = [
    { c: "#F2D26A", ic: "⏳", l: "Submitting intent #07", t: "just now" },
    { c: "#A8B9A3", ic: "🌉", l: "Solver matched · 0xSolverAlpha…", t: "2s" },
    { c: "#7A9572", ic: "✓", l: "Fill on Arbitrum · 0xfill1ab…", t: "22s · settled" },
  ];
  return (
    <div
      style={{
        marginTop: 18,
        padding: 24,
        borderRadius: 24,
        background: "#231B27",
        color: "#F4ECDA",
        position: "relative",
        boxShadow: "0 20px 48px rgba(31,26,20,.18)",
        animation: "fadeUp .35s cubic-bezier(.2,1.3,.4,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#A8B9A3",
              boxShadow: "0 0 0 4px rgba(168,185,163,.18)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Live keeper · 14s ago
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(244,236,218,.1)",
            border: 0,
            color: "#F4ECDA",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "rgba(244,236,218,.06)",
              borderRadius: 14,
              animation: `fadeUp .4s ${i * 180}ms both cubic-bezier(.2,1.3,.4,1)`,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: r.c,
                color: "#1A1410",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {r.ic}
            </span>
            <span style={{ flex: 1, fontFamily: "var(--f-mono)", fontSize: 12 }}>{r.l}</span>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, opacity: 0.55 }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
