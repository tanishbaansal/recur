"use client";

import Link from "next/link";
import { useState } from "react";

export type DemoKind = "streamflix" | "payroll" | "dca" | "heir";

type Demo = {
  kind: DemoKind;
  href: string;
  title: string;
  desc: string;
  bg: string;
  ink: string;
};

export function DemoCardCompact({ d }: { d: Demo }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={d.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: d.bg,
        borderRadius: 22,
        padding: "24px 24px 22px",
        boxShadow: hovered
          ? "0 24px 56px rgba(31,26,20,.16)"
          : "0 6px 18px rgba(31,26,20,.06)",
        transform: hovered ? "translateY(-10px)" : "translateY(0)",
        transition: "transform .35s cubic-bezier(.2,1.3,.4,1), box-shadow .25s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
        color: d.ink,
        display: "block",
      }}
    >
      <DemoIllustrationCompact kind={d.kind} hovered={hovered} />
      <h3
        className="t-display"
        style={{
          fontSize: 30,
          margin: "74px 0 0",
          color: d.ink,
          letterSpacing: "-.02em",
          lineHeight: 1.05,
        }}
      >
        {d.title}
      </h3>
      <p
        style={{
          color: d.ink,
          opacity: 0.78,
          marginTop: 10,
          marginBottom: 0,
          fontSize: 14,
          lineHeight: 1.5,
          minHeight: 64,
        }}
      >
        {d.desc}
      </p>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
          fontSize: 14,
          color: d.ink,
        }}
      >
        Try demo
        <span
          style={{
            display: "inline-block",
            transition: "transform .3s cubic-bezier(.2,1.3,.4,1)",
            transform: hovered ? "translate(4px,-4px)" : "translate(0,0)",
          }}
        >
          ↗
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          pointerEvents: "none",
          boxShadow: hovered
            ? `inset 0 0 0 1.5px ${d.ink}22`
            : "inset 0 0 0 0 transparent",
          transition: "box-shadow .25s",
        }}
      />
    </Link>
  );
}

function DemoIllustrationCompact({ kind, hovered }: { kind: DemoKind; hovered: boolean }) {
  if (kind === "streamflix") {
    return (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#C44A3F",
          display: "grid",
          placeItems: "center",
          color: "#F4ECDA",
          transform: hovered ? "rotate(-12deg) scale(1.06)" : "rotate(0)",
          transition: "transform .4s cubic-bezier(.2,1.3,.4,1)",
          boxShadow: "0 4px 0 #8E2E26",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
      </div>
    );
  }
  if (kind === "payroll") {
    return (
      <div style={{ position: "relative", width: 80, height: 64 }}>
        <Coin top={26} left={6} hovered={hovered} delay={0} />
        <Coin top={18} left={26} hovered={hovered} delay={60} />
        <Coin top={28} left={46} hovered={hovered} delay={120} />
      </div>
    );
  }
  if (kind === "dca") {
    return (
      <div style={{ position: "relative", width: 80, height: 64 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 12,
              top: 38 - i * 8,
              width: 48 - i * 8,
              height: 10,
              borderRadius: 5,
              background: i === 0 ? "#A6841B" : i === 1 ? "#B89421" : "#C9A22A",
              transform: hovered ? `translateY(${-2 - i * 2}px)` : "translateY(0)",
              transition: `transform .35s cubic-bezier(.2,1.3,.4,1) ${i * 60}ms`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 0,
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "#231B27",
            transform: `rotate(45deg) ${hovered ? "translate(0,-2px)" : ""}`,
            transition: "transform .35s cubic-bezier(.2,1.3,.4,1) 180ms",
          }}
        />
      </div>
    );
  }
  if (kind === "heir") {
    return (
      <div style={{ width: 64, height: 60, position: "relative" }}>
        <svg
          width="64"
          height="60"
          viewBox="0 0 64 60"
          style={{
            transform: hovered ? "scale(1.08)" : "scale(1)",
            transition: "transform .5s cubic-bezier(.2,1.3,.4,1)",
            filter: hovered ? "drop-shadow(0 0 8px rgba(232,168,155,.6))" : "none",
          }}
        >
          <path
            d="M32 54s-22-12-22-30c0-8 7-14 14-14 4 0 7 2 8 4 1-2 4-4 8-4 7 0 14 6 14 14 0 18-22 30-22 30z"
            fill="#E8A89B"
          />
          <circle cx="32" cy="24" r="4.5" fill="#F2D26A" />
        </svg>
      </div>
    );
  }
  return null;
}

function Coin({
  top,
  left,
  hovered,
  delay,
}: {
  top: number;
  left: number;
  hovered: boolean;
  delay: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "#7A9572",
        boxShadow: "inset -3px -3px 0 #4A6644",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: `transform .4s cubic-bezier(.2,1.3,.4,1) ${delay}ms`,
      }}
    />
  );
}
