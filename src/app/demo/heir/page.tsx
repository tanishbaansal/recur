"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { useRecur, type ProgressState } from "@/lib/recur/useRecur";
import { TopBar } from "@/components/recur-ds/Nav";
import {
  formatHMS,
  formatRemaining,
  useHeartbeat,
} from "@/components/heir/HeartbeatPanel";
import type { SignedIntent } from "@/lib/lifi/types";
import type { SupportedChainKey } from "@/lib/lifi/constants";

const DEST_OPTIONS: { key: SupportedChainKey; label: string }[] = [
  { key: "arbitrumSepolia", label: "Arbitrum Sepolia" },
  { key: "optimismSepolia", label: "Optimism Sepolia" },
  { key: "baseSepolia", label: "Base Sepolia" },
];

export default function HeirPage() {
  const { ready, authenticated, login } = usePrivy();
  const { subscribe, busy, progress, address } = useRecur();

  const [beneficiary, setBeneficiary] = useState("0x1F8EF9dAC1176788c18d6719db3e60EE5e417D5E");
  const [beneficiaryName, setBeneficiaryName] = useState("Amma");
  const [destChain, setDestChain] = useState<SupportedChainKey>("arbitrumSepolia");
  const [amount, setAmount] = useState("10");
  const [periods, setPeriods] = useState(6);
  const [fastMode, setFastMode] = useState(true);
  const [running, setRunning] = useState(false);
  const [subId, setSubId] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const thresholdSec = fastMode ? 120 : 30 * 24 * 60 * 60;
  const frequency = fastMode ? "minute" : "month";

  async function handleStart() {
    if (!authenticated) {
      login();
      return;
    }
    if (!beneficiary || !beneficiary.startsWith("0x") || beneficiary.length !== 42) {
      toast.error("Enter a valid beneficiary address.");
      return;
    }
    setRunning(true);
    try {
      const { subscription } = await subscribe({
        merchantName: `Last Will · ${beneficiaryName}`,
        merchantAddress: beneficiary as `0x${string}`,
        sourceChainKey: "baseSepolia",
        destChainKey: destChain,
        amountPerPeriod: amount,
        frequency,
        periods,
        firstFireDelaySec: fastMode ? 90 : 7 * 24 * 60 * 60,
        theme: "heir",
        type: "deadmans",
        heartbeatThresholdSec: thresholdSec,
      });
      setSubId(subscription.id);
      setRunning(false);
      setSetupOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  }

  return (
    <div className="paper-grain" style={{ minHeight: "100vh", color: "var(--ink)" }}>
      <TopBar />

      <LiveView
        subscriptionId={subId}
        sponsor={address ?? "0x0000000000000000000000000000000000000000"}
        beneficiary={(beneficiary || "0x1F8EF9dAC1176788c18d6719db3e60EE5e417D5E") as `0x${string}`}
        beneficiaryName={beneficiaryName}
        destChain={destChain}
        amount={amount}
        periods={periods}
        fastMode={fastMode}
        onSetupClick={() => setSetupOpen(true)}
      />

      {setupOpen ? (
        <SetupModal
          onClose={() => setSetupOpen(false)}
          ready={ready}
          authenticated={authenticated}
          busy={busy}
          address={address}
          beneficiary={beneficiary}
          setBeneficiary={setBeneficiary}
          beneficiaryName={beneficiaryName}
          setBeneficiaryName={setBeneficiaryName}
          destChain={destChain}
          setDestChain={setDestChain}
          amount={amount}
          setAmount={setAmount}
          periods={periods}
          setPeriods={setPeriods}
          fastMode={fastMode}
          setFastMode={setFastMode}
          onStart={handleStart}
        />
      ) : null}

      {running ? <RunningOverlay progress={progress} /> : null}
    </div>
  );
}

function SetupModal(props: {
  onClose: () => void;
  ready: boolean;
  authenticated: boolean;
  busy: boolean;
  address?: `0x${string}`;
  beneficiary: string;
  setBeneficiary: (v: string) => void;
  beneficiaryName: string;
  setBeneficiaryName: (v: string) => void;
  destChain: SupportedChainKey;
  setDestChain: (v: SupportedChainKey) => void;
  amount: string;
  setAmount: (v: string) => void;
  periods: number;
  setPeriods: (v: number) => void;
  fastMode: boolean;
  setFastMode: (v: boolean) => void;
  onStart: () => void;
}) {
  const {
    onClose,
    ready,
    authenticated,
    busy,
    address,
    beneficiary,
    setBeneficiary,
    beneficiaryName,
    setBeneficiaryName,
    destChain,
    setDestChain,
    amount,
    setAmount,
    periods,
    setPeriods,
    fastMode,
    setFastMode,
    onStart,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,9,8,.82)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="icon-btn"
        style={{ position: "absolute", right: 24, top: 24, background: "var(--bg)" }}
      >
        ✕
      </button>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="card card-xl"
        style={{
          background: "var(--bg)",
          padding: 32,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--hairline)",
        }}
      >
        <div
          className="t-mono"
          style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}
        >
          New will
        </div>
        <div className="t-display" style={{ fontSize: 28, marginTop: 4 }}>
          Set up your <span className="t-display-it">switch</span>
        </div>

        <Field label="Beneficiary name (display)">
          <input
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            className="input"
            placeholder="Amma"
          />
        </Field>

        <Field label="Beneficiary address">
          <input
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="input"
            style={{ fontFamily: "var(--f-mono)", fontSize: 13 }}
            placeholder="0x…"
          />
        </Field>

        <Field label="Destination chain">
          <select
            value={destChain}
            onChange={(e) => setDestChain(e.target.value as SupportedChainKey)}
            className="input"
            style={{ fontSize: 14 }}
          >
            {DEST_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
          <Field label="Amount per payout" tight>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="input"
              style={{ fontSize: 18 }}
            />
          </Field>
          <Field label="Payouts" tight>
            <input
              type="number"
              min={1}
              max={24}
              value={periods}
              onChange={(e) =>
                setPeriods(Math.max(1, Math.min(24, Number(e.target.value) || 1)))
              }
              className="input"
              style={{ fontSize: 18 }}
            />
          </Field>
        </div>

        <button
          onClick={() => setFastMode(!fastMode)}
          style={{
            marginTop: 18,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-1)",
            border: 0,
            borderRadius: 14,
            padding: 14,
            cursor: "pointer",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Fast demo mode</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              {fastMode
                ? "2-min check-in window · 1-min payouts"
                : "30-day check-in window · monthly payouts"}
            </div>
          </div>
          <span
            style={{
              position: "relative",
              width: 40,
              height: 22,
              borderRadius: 999,
              background: fastMode ? "var(--plum)" : "var(--surface-3)",
              transition: "background .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: fastMode ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#F4ECDA",
                transition: "left .2s",
              }}
            />
          </span>
        </button>

        {address ? (
          <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-3)" }}>
            Sponsor: {address.slice(0, 6)}…{address.slice(-4)} · deposit on Base Sepolia
          </div>
        ) : null}

        <button
          onClick={onStart}
          disabled={!ready || busy}
          className="btn btn-lg"
          style={{
            background: "var(--plum)",
            color: "#F4ECDA",
            width: "100%",
            justifyContent: "center",
            marginTop: 18,
            fontWeight: 600,
          }}
        >
          {authenticated ? "Set up the switch →" : "Sign in to continue"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  children,
  tight,
}: {
  label: string;
  children: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <div style={{ marginTop: tight ? 0 : 18 }}>
      <div
        className="t-mono"
        style={{
          fontSize: 11,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--text-3)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function LiveView({
  subscriptionId,
  sponsor,
  beneficiary,
  beneficiaryName,
  destChain,
  amount,
  periods,
  fastMode,
  onSetupClick,
}: {
  subscriptionId: string | null;
  sponsor: `0x${string}`;
  beneficiary: `0x${string}`;
  beneficiaryName: string;
  destChain: SupportedChainKey;
  amount: string;
  periods: number;
  fastMode: boolean;
  onSetupClick?: () => void;
}) {
  const preview = !subscriptionId;
  const [intents, setIntents] = useState<SignedIntent[]>([]);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const { heartbeat, busy, err, checkIn, walletReady } = useHeartbeat(subscriptionId, sponsor);

  useEffect(() => {
    if (err) toast.error(err);
  }, [err]);

  useEffect(() => {
    if (!subscriptionId) {
      const c = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
      return () => clearInterval(c);
    }
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}/intents`);
        const data = await res.json();
        if (alive) setIntents(data.intents ?? []);
      } catch {
        /* swallow */
      }
    }
    load();
    const i = setInterval(load, 5000);
    const c = setInterval(() => {
      if (alive) setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => {
      alive = false;
      clearInterval(i);
      clearInterval(c);
    };
  }, [subscriptionId]);

  // Preview/placeholder values used when no real subscription exists yet
  const previewThreshold = fastMode ? 120 : 30 * 24 * 60 * 60;
  const previewRemaining = preview ? Math.max(0, previewThreshold - (now % previewThreshold)) : 0;

  const elapsed = heartbeat ? now - heartbeat.lastAt : 0;
  const remaining = preview
    ? previewRemaining
    : heartbeat
    ? Math.max(0, heartbeat.thresholdSec - elapsed)
    : 0;
  const alive = preview ? true : heartbeat ? elapsed < heartbeat.thresholdSec : false;

  const skipped = preview ? 0 : intents.filter((i) => i.status === "SkippedAlive").length;
  const fired = preview ? 0 : intents.filter((i) => i.fired).length;
  const total = preview ? periods : intents.length || periods;
  const pending = preview ? total : intents.length - fired - skipped;
  const totalCommitted = (Number(amount) * total).toFixed(0);

  return (
    <>
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
            In case I&apos;m <span className="t-display-it">not around.</span>
          </h1>
        </div>
        <span className="chip" style={{ background: "var(--butter)", color: "#5b4716", padding: "8px 14px" }}>
          ● {preview ? "preview" : fastMode ? "demo mode" : "active"} · {Math.floor(
            (heartbeat?.thresholdSec ?? previewThreshold) / 60,
          )}{" "}
          min check-in
        </span>
      </div>

      <div style={{ padding: "12px 56px 24px", maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            background: "#231B27",
            borderRadius: 36,
            padding: "48px 48px 40px",
            color: "#F4ECDA",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="80"
            viewBox="0 0 1320 80"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, top: "42%", opacity: 0.14, pointerEvents: "none" }}
          >
            <path
              d="M0 40h120l16-26 20 52 22-46 28 38h180l14-18 20 36h900"
              stroke="#F4ECDA"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div
                className="t-mono"
                style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.65 }}
              >
                {alive ? "You've checked in" : "Switch tripped"}
              </div>
              <div
                className="t-display t-num"
                style={{ fontSize: 128, lineHeight: 0.95, letterSpacing: "-.03em", marginTop: 14 }}
              >
                {formatHMS(alive ? remaining : 0)}
              </div>
              <p style={{ marginTop: 14, fontSize: 15, opacity: 0.75, maxWidth: 420, lineHeight: 1.55 }}>
                Threshold · {formatRemaining(heartbeat?.thresholdSec ?? previewThreshold)} · Next payout becomes
                claimable in{" "}
                <span className="t-mono" style={{ color: "#F4ECDA" }}>
                  {formatRemaining(remaining)}
                </span>
              </p>
              <button
                onClick={preview ? onSetupClick : checkIn}
                disabled={preview ? false : busy || !walletReady}
                className="btn btn-lg"
                style={{
                  background: "#F4ECDA",
                  color: "#231B27",
                  marginTop: 20,
                  fontWeight: 600,
                }}
              >
                {preview
                  ? "Set up your switch ↓"
                  : busy
                  ? "Signing…"
                  : "I'm still here ↓"}
              </button>
              <p style={{ fontSize: 12, opacity: 0.55, marginTop: 10 }}>
                {preview
                  ? "Preview — set up your own to make it live."
                  : "A silent signature via Privy. No gas. No popup."}
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ background: "rgba(244,236,218,.06)", borderRadius: 24, padding: 24 }}>
                <div
                  className="t-mono"
                  style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.55 }}
                >
                  Beneficiary
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #E8A89B, #F2D26A)",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 22, fontFamily: "var(--f-display)" }}>{beneficiaryName}</div>
                    <div className="t-mono" style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {`${beneficiary.slice(0, 6)}…${beneficiary.slice(-4)}`} · {destChain}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div
                      className="t-mono"
                      style={{ fontSize: 11, opacity: 0.55, letterSpacing: ".1em", textTransform: "uppercase" }}
                    >
                      Committed
                    </div>
                    <div className="t-display t-num" style={{ fontSize: 28 }}>
                      {totalCommitted}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.55 }}>
                      USDC · {total} payouts
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(244,236,218,.06)", borderRadius: 24, padding: 20 }}>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    opacity: 0.55,
                    marginBottom: 10,
                  }}
                >
                  Message to {beneficiaryName}
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, fontStyle: "italic", opacity: 0.85 }}>
                  &ldquo;If you&apos;re reading this, remember to water the basil plant.
                  <br />
                  And know I loved you.&rdquo;
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <span className="t-mono" style={{ fontSize: 11, opacity: 0.5 }}>
                    signed · {new Date().toISOString().slice(0, 10)}
                  </span>
                  <span className="t-mono" style={{ fontSize: 11, opacity: 0.5 }}>
                    0xmsg…7f
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "24px 56px 56px",
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
              gap: 12,
            }}
          >
            <div>
              <div
                className="t-mono"
                style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}
              >
                Pre-signed intents
              </div>
              <h3 className="t-display" style={{ fontSize: 26, margin: "4px 0 0" }}>
                {total} payouts <span className="t-display-it">armed.</span>
              </h3>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-2)" }}>
              <span>
                🕊 skipped (alive) · <strong style={{ color: "var(--ink)" }}>{skipped}</strong>
              </span>
              <span>
                ⏳ pending · <strong style={{ color: "var(--ink)" }}>{pending}</strong>
              </span>
              <span>
                ✅ fired · <strong style={{ color: "var(--ink)" }}>{fired}</strong>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 8 }}>
            {Array.from({ length: total }).map((_, i) => {
              const intent = intents[i];
              const isFired = intent?.fired === true;
              const isSkipped = intent?.status === "SkippedAlive";
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: isFired
                      ? "var(--sage-d)"
                      : isSkipped
                      ? "var(--plum)"
                      : "var(--surface-2)",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    color: isFired ? "#F4ECDA" : isSkipped ? "#F4ECDA" : "var(--plum)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isFired ? "✓" : "🕊"}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      fontFamily: "var(--f-mono)",
                      fontSize: 9,
                      color: isFired || isSkipped ? "rgba(244,236,218,.6)" : "var(--text-3)",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: "var(--surface-1)",
              borderRadius: 14,
              fontSize: 13,
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--plum)" }} />
            Each dove = one payout skipped because you checked in. Miss the threshold → it becomes a ✅
            and {beneficiaryName} can claim {amount} USDC on {destChain}.
          </div>
        </div>

        <div className="card card-xl" style={{ padding: 24, background: "var(--bg)" }}>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}
          >
            Heartbeat log
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <HeartbeatLogRow t={`${formatRemaining(elapsed)} ago`} via="silent · Privy" />
            <HeartbeatLogRow t="set up" via="initial heartbeat" />
          </div>
          <Link
            href="/app"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
          >
            Open dashboard →
          </Link>
        </div>
      </div>
    </>
  );
}

function HeartbeatLogRow({ t, via }: { t: string; via: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "var(--surface-1)",
        borderRadius: 12,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "var(--plum)",
          color: "#F4ECDA",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        ♥
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>I&apos;m still here</div>
        <div className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
          {via}
        </div>
      </div>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--text-2)" }}>
        {t}
      </span>
    </div>
  );
}

function RunningOverlay({ progress }: { progress: ProgressState }) {
  const steps = [
    { label: "Approve USDC to The Compact", status: progress.approve },
    { label: "Deposit into resource lock", status: progress.deposit },
    {
      label: `Sign ${progress.sign.signed}/${progress.sign.total} payouts`,
      status: progress.sign.status,
    },
    { label: "Arm the switch", status: progress.save },
  ];
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
      }}
    >
      <div
        className="card card-xl"
        style={{ background: "var(--bg)", padding: 32, maxWidth: 460, width: "100%" }}
      >
        <div
          className="t-mono"
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--plum)",
          }}
        >
          Arming your will
        </div>
        <ul style={{ marginTop: 22, listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {steps.map((s) => (
            <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background:
                    s.status === "done"
                      ? "var(--plum)"
                      : s.status === "running"
                      ? "var(--plum-d)"
                      : "var(--surface-2)",
                  color: "#F4ECDA",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {s.status === "done" ? "✓" : s.status === "running" ? "…" : "·"}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: s.status === "running" ? "var(--ink)" : "var(--text-2)",
                  fontWeight: s.status === "running" ? 500 : 400,
                }}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
