"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { useRecur, type ProgressState } from "@/lib/recur/useRecur";

const PLAN = {
  name: "Premium 4K",
  price: "10",
  features: [
    "4 simultaneous screens",
    "Watch on any device",
    "Cancel any month",
    "Powered by The Compact resource lock",
  ],
};

const MERCHANT_ADDRESS = "0x1F8EF9dAC1176788c18d6719db3e60EE5e417D5E" as const;

export function CheckoutFlow({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: (subId: string) => void;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { subscribe, progress, busy, address } = useRecur();
  const [stage, setStage] = useState<"plan" | "confirm" | "running" | "done">("plan");

  useEffect(() => {
    if (progress.error) toast.error(progress.error);
  }, [progress.error]);
  const [subId, setSubId] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!authenticated) {
      login();
      return;
    }
    setStage("running");
    try {
      const { subscription } = await subscribe({
        merchantName: "Streamflix",
        merchantAddress: MERCHANT_ADDRESS,
        sourceChainKey: "baseSepolia",
        destChainKey: "arbitrumSepolia",
        amountPerPeriod: PLAN.price,
        frequency: "minute",
        periods: 4,
        firstFireDelaySec: 90,
        theme: "streamflix",
      });
      setSubId(subscription.id);
      setStage("done");
    } catch (e) {
      console.error(e);
      setStage("confirm");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 9, 8, .82)",
        backdropFilter: "blur(12px)",
      }}
    >
      <button
        aria-label="Close"
        onClick={onCancel}
        className="icon-btn"
        style={{ position: "absolute", right: 24, top: 24, background: "var(--bg)" }}
      >
        ✕
      </button>

      <div style={{ width: "100%", maxWidth: 560, padding: "0 24px" }}>
        <AnimatePresence mode="wait">
          {stage === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card card-xl"
              style={{ background: "var(--bg)", padding: 32 }}
            >
              <div style={{ textAlign: "center" }}>
                <span className="wordmark" style={{ fontSize: 28 }}>Recur</span>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  Pick your plan
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  borderRadius: 20,
                  background: "var(--surface-1)",
                  padding: 24,
                  border: "1px solid rgba(196,74,63,.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div
                      className="t-mono"
                      style={{
                        fontSize: 11,
                        color: "#C44A3F",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                      }}
                    >
                      Most popular
                    </div>
                    <div className="t-display" style={{ fontSize: 28, marginTop: 4 }}>
                      {PLAN.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="t-display t-num" style={{ fontSize: 38 }}>
                      {PLAN.price}
                      <span style={{ marginLeft: 4, fontSize: 14, color: "var(--text-3)" }}>USDC</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>per month</div>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 8 }}>
                  {PLAN.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: "var(--sage)",
                          color: "#1f2c1c",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setStage("confirm")}
                className="btn btn-lg"
                style={{
                  background: "#C44A3F",
                  color: "#F4ECDA",
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 24,
                  fontWeight: 600,
                }}
              >
                Subscribe with Recur →
              </button>
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
                Pay from Base · Streamflix receives on Arbitrum · Gasless after deposit
              </div>
            </motion.div>
          )}

          {stage === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card card-xl"
              style={{ background: "var(--bg)", padding: 32 }}
            >
              <div style={{ textAlign: "center" }}>
                <span className="wordmark" style={{ fontSize: 22 }}>Recur</span>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  Review subscription
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  borderRadius: 16,
                  background: "var(--surface-1)",
                  padding: 20,
                  display: "grid",
                  gap: 10,
                  fontSize: 14,
                }}
              >
                <Row label="Plan" value={PLAN.name} />
                <Row label="Price" value={`${PLAN.price} USDC / month`} />
                <Row label="Pays from" value="Your Base USDC balance" />
                <Row label="Pays to" value="streamflix.eth (Arbitrum)" />
                <Row label="Auto-renew" value="4 cycles (demo: every minute)" />
                <Row label="Network" value="Base Sepolia → Arbitrum Sepolia" />
                {address ? (
                  <Row label="Your wallet" value={`${address.slice(0, 6)}…${address.slice(-4)}`} />
                ) : null}
              </div>

              <div
                style={{
                  marginTop: 16,
                  background: "var(--butter)",
                  color: "#5b4716",
                  padding: 12,
                  borderRadius: 12,
                  fontSize: 12,
                }}
              >
                You&apos;ll sign once for deposit (on-chain) + 4 gasless EIP-712 signatures for each
                month. Solvers fill on Arbitrum within ~22 seconds per payment.
              </div>

              <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button onClick={onCancel} className="btn btn-ghost" style={{ justifyContent: "center" }}>
                  Cancel
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={!ready || busy}
                  className="btn"
                  style={{
                    background: "#C44A3F",
                    color: "#F4ECDA",
                    fontWeight: 600,
                    justifyContent: "center",
                  }}
                >
                  {authenticated ? "Confirm & Sign" : "Sign in to subscribe"}
                </button>
              </div>
            </motion.div>
          )}

          {stage === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card card-xl"
              style={{ background: "var(--bg)", padding: 32 }}
            >
              <div style={{ textAlign: "center" }}>
                <span className="wordmark" style={{ fontSize: 22 }}>Recur</span>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  Setting up your subscription
                </div>
              </div>
              <Progress progress={progress} />
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card card-xl"
              style={{ background: "var(--bg)", padding: 40, textAlign: "center" }}
            >
              <div
                style={{
                  margin: "0 auto 16px",
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  background: "var(--sage)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={32}
                  height={32}
                  fill="none"
                  stroke="#1f2c1c"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div className="t-display" style={{ fontSize: 28 }}>You&apos;re subscribed</div>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-2)" }}>
                First Streamflix payment fires automatically in ~90 seconds. Track it on your
                dashboard.
              </div>
              <button
                onClick={() => subId && onDone(subId)}
                className="btn btn-lg"
                style={{
                  background: "#C44A3F",
                  color: "#F4ECDA",
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 24,
                  fontWeight: 600,
                }}
              >
                Open dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

function Progress({ progress }: { progress: ProgressState }) {
  const steps = [
    { key: "approve", label: "Approving USDC to The Compact", status: progress.approve },
    { key: "deposit", label: "Depositing into resource lock", status: progress.deposit },
    {
      key: "sign",
      label: `Signing ${progress.sign.signed}/${progress.sign.total} subscription periods`,
      status: progress.sign.status,
    },
    { key: "save", label: "Saving subscription", status: progress.save },
  ];

  return (
    <ul style={{ marginTop: 28, listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
      {steps.map((s) => (
        <li
          key={s.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--surface-1)",
            padding: 14,
            borderRadius: 14,
          }}
        >
          <StatusDot status={s.status} />
          <span
            style={{
              fontSize: 14,
              color:
                s.status === "done"
                  ? "var(--text-2)"
                  : s.status === "running"
                  ? "var(--ink)"
                  : "var(--text-3)",
              fontWeight: s.status === "running" ? 500 : 400,
            }}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { status: "idle" | "running" | "done" | "error" }) {
  if (status === "done") {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "#C44A3F",
          color: "#F4ECDA",
          display: "grid",
          placeItems: "center",
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
          borderTopColor: "#C44A3F",
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        border: "1px solid var(--surface-2)",
      }}
    />
  );
}
