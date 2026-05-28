"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRecur, type ProgressState } from "@/lib/recur/useRecur";
import { TopBar } from "@/components/recur-ds/Nav";
import { ChainChip, LiveFireRow, TokenChip, USDCCoin } from "@/components/recur-ds/primitives";
import type { SupportedChainKey } from "@/lib/lifi/constants";

type Cadence = "minute" | "week" | "month";

const CADENCES: Array<{ key: Cadence; label: string; short: string }> = [
  { key: "minute", label: "Every minute (demo)", short: "D" },
  { key: "week", label: "Every week", short: "W" },
  { key: "month", label: "Every month", short: "M" },
];

const DEST_OPTIONS: { key: SupportedChainKey; label: string }[] = [
  { key: "arbitrumSepolia", label: "Arbitrum Sepolia" },
  { key: "optimismSepolia", label: "Optimism Sepolia" },
  { key: "baseSepolia", label: "Base Sepolia" },
];

export default function DcaPage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { subscribe, busy, progress, address } = useRecur();

  const [amount, setAmount] = useState("10");
  const [cadence, setCadence] = useState<Cadence>("minute");
  const [periods, setPeriods] = useState(8);
  const [destChain, setDestChain] = useState<SupportedChainKey>("arbitrumSepolia");
  const [recipient, setRecipient] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const recipientAddress = (recipient.trim() || address || "") as `0x${string}` | "";
  const totalDeposit = useMemo(
    () => (Number(amount || "0") * periods).toFixed(2),
    [amount, periods],
  );

  async function handleStart() {
    if (!authenticated) {
      login();
      return;
    }
    if (!recipientAddress || !recipientAddress.startsWith("0x")) {
      toast.error("Connect a wallet or enter a recipient address.");
      return;
    }
    setRunning(true);
    try {
      await subscribe({
        merchantName: "Recur Stack",
        merchantAddress: recipientAddress as `0x${string}`,
        sourceChainKey: "baseSepolia",
        destChainKey: destChain,
        amountPerPeriod: amount,
        frequency: cadence,
        periods,
        firstFireDelaySec: 60,
        theme: "dca",
        type: "dca",
      });
      setRunning(false);
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  }

  return (
    <div className="paper-grain" style={{ minHeight: "100vh", color: "var(--ink)" }}>
      <TopBar />

      <div
        style={{
          padding: "40px 56px 24px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <div>
          <h1
            className="t-display"
            style={{ fontSize: 64, margin: 0, letterSpacing: "-.025em", lineHeight: 1 }}
          >
            Stack ETH on <span className="t-display-it">autopilot.</span>
          </h1>
        </div>
        <span className="chip" style={{ background: "var(--butter)", color: "#5b4716" }}>
          ● stacking · 0 of {periods} this run
        </span>
      </div>

      {/* Top split: widget + position summary */}
      <div
        style={{
          padding: "12px 56px 24px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 24,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        {/* Widget */}
        <div className="card card-xl" style={{ padding: 32, background: "var(--surface-1)" }}>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}
          >
            Stack setup
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <div
              style={{
                flex: 1,
                padding: "14px 16px",
                background: "var(--bg)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <USDCCoin size={30} />
              <div>
                <div style={{ fontWeight: 600 }}>USDC</div>
                <ChainChip name="baseSepolia" size={11} />
              </div>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                background: "var(--butter)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              →
            </div>
            <div
              style={{
                flex: 1,
                padding: "14px 16px",
                background: "var(--bg)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "#2775CA",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--f-display)",
                  fontSize: 15,
                }}
              >
                $
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>USDC</div>
                <select
                  value={destChain}
                  onChange={(e) => setDestChain(e.target.value as SupportedChainKey)}
                  style={{
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    fontSize: 11,
                    color: "var(--text-2)",
                    fontFamily: "var(--f-mono)",
                  }}
                >
                  {DEST_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              Amount per buy
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="t-display t-num"
                style={{
                  fontSize: 84,
                  lineHeight: 1,
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  width: "100%",
                  color: "var(--ink)",
                  flex: 1,
                }}
              />
              <span style={{ marginLeft: "auto" }}>
                <TokenChip amt="USDC" sym="" />
              </span>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--bg)", borderRadius: 14, padding: 14 }}>
              <div
                className="t-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--text-3)",
                }}
              >
                Frequency
              </div>
              <div
                style={{
                  display: "inline-flex",
                  marginTop: 8,
                  background: "var(--surface-1)",
                  borderRadius: 10,
                  padding: 3,
                }}
              >
                {CADENCES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCadence(c.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: cadence === c.key ? "var(--butter)" : "transparent",
                      color: "#1A1410",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    {c.short}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                {CADENCES.find((c) => c.key === cadence)?.label}
              </div>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 14, padding: 14 }}>
              <div
                className="t-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--text-3)",
                }}
              >
                Duration
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={periods}
                  onChange={(e) =>
                    setPeriods(Math.max(1, Math.min(52, Number(e.target.value) || 1)))
                  }
                  className="t-display t-num"
                  style={{
                    fontSize: 22,
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    width: 48,
                    color: "var(--ink)",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>buys</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--text-3)",
                    fontFamily: "var(--f-mono)",
                  }}
                >
                  {totalDeposit} USDC
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-3)" }}>
            Recipient on {destChain}:{" "}
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={address ?? "0x… your wallet"}
              style={{
                background: "transparent",
                border: 0,
                outline: 0,
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                color: "var(--text-2)",
                width: 320,
                maxWidth: "100%",
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!ready || busy}
            className="btn btn-lg"
            style={{
              background: "var(--butter)",
              color: "#1A1410",
              width: "100%",
              justifyContent: "center",
              marginTop: 18,
              fontWeight: 600,
            }}
          >
            {authenticated ? "Start stacking →" : "Sign in to start"}
          </button>
        </div>

        {/* Position summary */}
        <div style={{ display: "grid", gap: 16 }}>
          <div
            className="card card-xl"
            style={{ padding: 28, background: "#1A1410", color: "#F4ECDA", position: "relative", overflow: "hidden" }}
          >
            <div
              className="t-mono"
              style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}
            >
              Position so far (demo)
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
              <span className="t-display t-num" style={{ fontSize: 64, lineHeight: 1 }}>
                0.131
              </span>
              <span style={{ fontSize: 18, opacity: 0.5 }}>ETH</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid rgba(244,236,218,.08)",
              }}
            >
              <div>
                <div className="t-mono" style={{ fontSize: 10, opacity: 0.55 }}>
                  Spent
                </div>
                <div className="t-num" style={{ fontSize: 18, fontWeight: 600 }}>
                  400 USDC
                </div>
              </div>
              <div>
                <div className="t-mono" style={{ fontSize: 10, opacity: 0.55 }}>
                  Cost basis
                </div>
                <div className="t-num" style={{ fontSize: 18, fontWeight: 600 }}>
                  $3,053
                </div>
              </div>
              <div>
                <div className="t-mono" style={{ fontSize: 10, opacity: 0.55 }}>
                  Value
                </div>
                <div className="t-num" style={{ fontSize: 18, fontWeight: 600, color: "var(--butter)" }}>
                  $418
                </div>
              </div>
            </div>
            <svg width="100%" height="60" viewBox="0 0 400 60" style={{ marginTop: 14 }}>
              <path
                d="M0 50 L40 44 L80 46 L120 38 L160 42 L200 30 L240 34 L280 22 L320 26 L360 18 L400 14"
                stroke="var(--butter)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M0 50 L40 44 L80 46 L120 38 L160 42 L200 30 L240 34 L280 22 L320 26 L360 18 L400 14 L400 60 L0 60 Z"
                fill="var(--butter)"
                opacity=".18"
              />
            </svg>
          </div>

          <div className="card card-xl" style={{ padding: 22, background: "var(--butter)", color: "#3a2d08" }}>
            <div
              className="t-mono"
              style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.7 }}
            >
              Next buy
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 8,
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span className="t-display" style={{ fontSize: 28 }}>
                {cadence === "minute"
                  ? "≈ 60 seconds"
                  : cadence === "week"
                  ? "Next Friday"
                  : "Next month"}
              </span>
              <span className="t-mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {amount || 0} USDC → ~{((Number(amount) || 0) / 3070).toFixed(4)} ETH
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <LiveFireRow stage={1} dstLabel={destChain.replace("Sepolia", "")} />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar + fills (visual placeholder, design data) */}
      <div
        style={{
          padding: "12px 56px 56px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 24,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <div className="card card-xl" style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 18,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3 className="t-display" style={{ fontSize: 28, margin: 0 }}>
              {periods} buys ·{" "}
              <span className="t-display-it">0 down, {periods} to go</span>
            </h3>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-2)" }}>
              <span>● filled · 0</span>
              <span>○ scheduled · {periods}</span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(13, periods)}, 1fr)`,
              gap: 10,
            }}
          >
            {Array.from({ length: periods }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--text-3)",
                  fontFamily: "var(--f-mono)",
                  fontSize: 9,
                  fontWeight: 600,
                  boxShadow: i === 0 ? "0 0 0 3px var(--butter)" : "none",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="card card-xl" style={{ padding: 24 }}>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}
          >
            Recent fills (demo data)
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[
              { d: "24 May", s: "50.00", g: "0.0163", px: "3,067" },
              { d: "17 May", s: "50.00", g: "0.0157", px: "3,184" },
              { d: "10 May", s: "50.00", g: "0.0171", px: "2,924" },
              { d: "03 May", s: "50.00", g: "0.0165", px: "3,030" },
            ].map((r) => (
              <div
                key={r.d}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--surface-1)",
                  borderRadius: 12,
                }}
              >
                <span
                  className="t-mono"
                  style={{ fontSize: 11, color: "var(--text-3)", minWidth: 54 }}
                >
                  {r.d}
                </span>
                <span className="t-mono" style={{ fontSize: 13 }}>{r.s} USDC</span>
                <span style={{ color: "var(--text-3)" }}>→</span>
                <span className="t-mono" style={{ fontSize: 13, fontWeight: 600 }}>{r.g} ETH</span>
                <span
                  className="t-mono"
                  style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}
                >
                  @ {r.px}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {running ? (
        <RunningOverlay
          progress={progress}
          amount={amount}
          periods={periods}
          cadence={cadence}
          destChain={destChain}
        />
      ) : null}

      {done ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,9,8,.82)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="card card-xl"
            style={{ background: "var(--bg)", padding: 40, maxWidth: 460, textAlign: "center" }}
          >
            <div
              style={{
                margin: "0 auto 14px",
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--butter)",
                display: "grid",
                placeItems: "center",
                fontSize: 28,
              }}
            >
              ↗
            </div>
            <div className="t-display" style={{ fontSize: 28 }}>
              Stack scheduled
            </div>
            <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 8 }}>
              First buy fires in ~60s. Track every fill on the dashboard.
            </p>
            <button
              onClick={() => router.push("/app")}
              className="btn btn-lg"
              style={{
                background: "var(--butter)",
                color: "#1A1410",
                width: "100%",
                justifyContent: "center",
                marginTop: 22,
                fontWeight: 600,
              }}
            >
              Open dashboard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RunningOverlay({
  progress,
  amount,
  periods,
  cadence,
  destChain,
}: {
  progress: ProgressState;
  amount: string;
  periods: number;
  cadence: Cadence;
  destChain: SupportedChainKey;
}) {
  const statuses = [
    progress.approve,
    progress.deposit,
    progress.sign.status,
    progress.save,
  ];
  const doneCount = statuses.filter((s) => s === "done").length;
  const pct = Math.round((doneCount / statuses.length) * 100);
  const cadenceLabel = CADENCES.find((c) => c.key === cadence)?.label ?? cadence;
  const chainLabel =
    DEST_OPTIONS.find((d) => d.key === destChain)?.label ?? destChain;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,9,8,.82)",
        backdropFilter: "blur(12px)",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-xl"
        style={{ background: "var(--bg)", padding: 32, maxWidth: 520, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div
            className="t-mono"
            style={{
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#8B6C14",
            }}
          >
            Setting up your stack
          </div>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".08em", color: "var(--text-3)" }}
          >
            {pct}%
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            height: 4,
            borderRadius: 999,
            background: "var(--surface-2)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 24 }}
            style={{ height: "100%", background: "var(--butter-d)", borderRadius: 999 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              flexShrink: 0,
              background: "linear-gradient(135deg, #F2D26A, #E5B83C)",
              boxShadow: "0 4px 12px rgba(229,184,60,.35)",
              display: "grid",
              placeItems: "center",
              color: "#3A2D08",
              fontWeight: 700,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M6 11l6-6 6 6" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1 }}>
              Recur Stack
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>
              DCA into ETH · {cadenceLabel.toLowerCase()}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 13,
            color: "var(--text-2)",
          }}
        >
          <span className="t-mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
            {amount} USDC
          </span>
          <span style={{ color: "var(--text-3)" }}>×</span>
          <span className="t-mono">{periods}</span>
          <span style={{ color: "var(--text-3)" }}>→</span>
          <span className="t-mono" style={{ color: "var(--ink)" }}>{chainLabel}</span>
        </div>

        <ul style={{ marginTop: 24, listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          <DcaProgressRow label="Approve USDC to The Compact" status={progress.approve} />
          <DcaProgressRow label="Deposit into resource lock" status={progress.deposit} />
          <DcaProgressRow
            label={`Sign ${progress.sign.signed}/${progress.sign.total} buys`}
            status={progress.sign.status}
          />
          <DcaProgressRow label="Save subscription" status={progress.save} />
        </ul>
      </motion.div>
    </motion.div>
  );
}

function DcaProgressRow({
  label,
  status,
}: {
  label: string;
  status: "idle" | "running" | "done" | "error";
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: status === "running" ? "rgba(229,184,60,.12)" : "var(--surface-1)",
        padding: 14,
        borderRadius: 14,
        transition: "background 200ms ease",
      }}
    >
      <DcaProgressDot status={status} />
      <span
        style={{
          fontSize: 14,
          color:
            status === "done"
              ? "var(--text-2)"
              : status === "running"
              ? "var(--ink)"
              : "var(--text-3)",
          fontWeight: status === "running" ? 600 : 400,
        }}
      >
        {label}
      </span>
    </li>
  );
}

function DcaProgressDot({ status }: { status: "idle" | "running" | "done" | "error" }) {
  if (status === "done") {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "var(--butter-d)",
          color: "#1A1410",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor">
          <path d="M6.7 11.5 3.2 8l1.4-1.4L6.7 8.7l4.7-4.7 1.4 1.4z" />
        </svg>
      </span>
    );
  }
  if (status === "running") {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          border: "2px solid var(--surface-2)",
          borderTopColor: "var(--butter-d)",
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === "error") {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "var(--err, #C44A3F)",
          color: "#F4ECDA",
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        !
      </span>
    );
  }
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: "var(--surface-2)",
        display: "grid",
        placeItems: "center",
        color: "var(--text-3)",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      ·
    </span>
  );
}
