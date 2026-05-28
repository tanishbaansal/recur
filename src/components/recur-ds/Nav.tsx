"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectButton } from "@/components/ConnectButton";

export function RecurLogo({ size = 44 }: { size?: number }) {
  const [hovered, setHovered] = useState(false);
  const ringR = (size / 2) - 1.5;
  const dotR = 2.5;
  const markSize = size - 6;
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        aria-label="Recur"
        style={{ position: "relative", zIndex: 1, borderRadius: markSize * 0.25 }}
      >
        <rect width="32" height="32" rx="8" fill="#231B27" />
        <text
          x="16"
          y="24"
          textAnchor="middle"
          fontFamily="var(--f-display, Georgia, serif)"
          fontStyle="italic"
          fontWeight={500}
          fontSize="24"
          fill="#F4ECDA"
          letterSpacing="-1"
        >
          r
        </text>
        <circle cx="22.5" cy="10" r="2.4" fill="#E8A89B" />
        <circle cx="22.5" cy="10" r="2.4" fill="none" stroke="#231B27" strokeWidth="0.6" />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className="recur-logo-ring"
        style={{
          position: "absolute",
          inset: 0,
          animation: hovered
            ? "recurLogoSpin 2s linear infinite"
            : "recurLogoSpin 12s linear infinite",
          transition: "animation-duration .3s linear",
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={ringR}
          fill="none"
          stroke="var(--butter-d)"
          strokeWidth="1.5"
          strokeDasharray="2 4"
          opacity="0.8"
        />
        <circle
          cx={size / 2}
          cy={1.5}
          r={dotR}
          fill="var(--butter-d)"
        />
      </svg>
    </span>
  );
}

export function TopBar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "18px 56px",
        background: "rgba(250,247,242,.86)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <RecurLogo size={44} />
        <span className="wordmark" style={{ fontSize: 26, color: "#1A1410" }}>
          Recur
        </span>
      </Link>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 36,
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <DemosMenu />
        <Link href="/#how" style={{ color: "#1A1410", textDecoration: "none" }}>
          How it works
        </Link>
        <a
          href="https://docs.li.fi/lifi-intents/introduction"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1A1410", textDecoration: "none" }}
        >
          Docs
        </a>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
        <Link
          href="/app"
          className="btn btn-sm btn-ghost"
          style={{ textDecoration: "none" }}
        >
          Launch App
        </Link>
        <ConnectButton variant="primary" className="btn-sm" />
      </div>
    </header>
  );
}

type DemoItem = {
  href: string;
  title: string;
  blurb: string;
  bg: string;
  ink: string;
  icon: React.ReactNode;
};

const DEMOS: DemoItem[] = [
  {
    href: "/demo/streamflix",
    title: "Streamflix",
    blurb: "Netflix-style subscription · auto-renews monthly",
    bg: "#E8A89B",
    ink: "#2A1612",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    ),
  },
  {
    href: "/demo/payroll",
    title: "Payroll",
    blurb: "Pay a team on 5 chains from one deposit",
    bg: "#A8B9A3",
    ink: "#1C2A1A",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="3" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="7" r="2" />
        <path d="M14 14c0-2 2-3 3-3s3 1 3 3" />
      </svg>
    ),
  },
  {
    href: "/demo/dca",
    title: "Recur Stack",
    blurb: "DCA into ETH every Friday · gasless",
    bg: "#F2D26A",
    ink: "#3A2D08",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </svg>
    ),
  },
  {
    href: "/demo/heir",
    title: "Last Will",
    blurb: "Dead man's switch · fires only if you stop checking in",
    bg: "#231B27",
    ink: "#F4ECDA",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z" />
      </svg>
    ),
  },
];

function DemosMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }
  function scheduleHide() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
      style={{ position: "relative", display: "inline-flex" }}
    >
      <Link
        href="/#demos"
        style={{
          color: "#1A1410",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 0",
        }}
      >
        Demos
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          style={{ display: "inline-flex", marginLeft: 2 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </Link>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="demos-sheet"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.6 }}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: -16,
              minWidth: 360,
              padding: 8,
              borderRadius: 22,
              background: "var(--bg)",
              boxShadow: "var(--sh-3)",
              border: "1px solid var(--hairline)",
              transformOrigin: "top center",
              zIndex: 30,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -6,
                left: 36,
                transform: "rotate(45deg)",
                width: 12,
                height: 12,
                background: "var(--bg)",
                border: "1px solid var(--hairline)",
                borderRight: 0,
                borderBottom: 0,
                borderRadius: 3,
              }}
            />
            <div
              className="t-mono"
              style={{
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                padding: "10px 12px 6px",
              }}
            >
              4 demos · same primitive
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
              {DEMOS.map((d, i) => (
                <motion.li
                  key={d.href}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, type: "spring", stiffness: 380, damping: 28 }}
                >
                  <DemoMenuRow item={d} />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

function DemoMenuRow({ item }: { item: DemoItem }) {
  const [h, setH] = useState(false);
  return (
    <Link
      href={item.href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 14,
        textDecoration: "none",
        color: "var(--ink)",
        background: h ? "var(--surface-1)" : "transparent",
        transition: "background .15s",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: item.bg,
          color: item.ink,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          transform: h ? "rotate(-6deg) scale(1.06)" : "rotate(0)",
          transition: "transform .25s cubic-bezier(.2,1.3,.4,1)",
        }}
      >
        {item.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{item.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>{item.blurb}</div>
      </div>
      <motion.span
        animate={{ x: h ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        style={{ color: "var(--text-3)", fontSize: 14 }}
      >
        →
      </motion.span>
    </Link>
  );
}

export function FooterStrip() {
  const chains: Array<[string, string]> = [
    ["LI.FI", "#FF4D7E"],
    ["The Compact", "#1F1A14"],
    ["Privy", "#1B4DFF"],
    ["Base", "#0052FF"],
    ["Arbitrum", "#28A0F0"],
  ];
  return (
    <footer
      style={{
        padding: "56px 80px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {chains.map(([n, c]) => (
          <span
            key={n}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(31,26,20,.06)",
              padding: "9px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              color: "#1A1410",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            {n}
          </span>
        ))}
      </div>
      <span className="t-display-it" style={{ fontSize: 16, color: "#7a6f63" }}>
        github · x · mirror · made warmly for the LI.FI Intents challenge
      </span>
    </footer>
  );
}
