"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";
import { TopBar } from "@/components/recur-ds/Nav";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useRecur } from "@/lib/recur/useRecur";
import { badgeKindForTheme } from "@/components/recur-ds/primitives";
import {
  IconBolt,
  IconCheck,
  IconChain,
  IconClock,
  IconDove,
  IconPlus,
} from "@/components/recur-ds/icons";
import type { Subscription } from "@/lib/lifi/types";

type FilterKey = "all" | "subscription" | "dca" | "payroll" | "lastwill";

export default function AppDashboard() {
  const { ready, authenticated } = usePrivy();
  const { address, getBalances } = useRecur();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<{
    wallet: bigint;
    compact: bigint;
    symbol: string;
    decimals: number;
  } | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!address) return;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/subscriptions?sponsor=${address}`);
        const data = await res.json();
        if (alive) setSubs(data.subscriptions ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address]);

  useEffect(() => {
    if (!address) return;
    let alive = true;
    async function load() {
      const res = await getBalances("baseSepolia");
      if (alive && res) {
        setBalance({
          wallet: res.walletBalance,
          compact: res.compactBalance,
          symbol: res.token.symbol,
          decimals: res.token.decimals,
        });
      }
    }
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address, getBalances]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const t = setInterval(async () => {
      try {
        await fetch("/api/keeper/tick", { method: "POST" });
        setLastTick(Math.floor(Date.now() / 1000));
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(t);
  }, [ready, authenticated]);

  async function triggerKeeper() {
    setTriggering(true);
    try {
      await fetch("/api/keeper/tick", { method: "POST" });
      setLastTick(Math.floor(Date.now() / 1000));
    } finally {
      setTriggering(false);
    }
  }

  const counts = useMemo(() => {
    const c = { subscription: 0, dca: 0, payroll: 0, lastwill: 0 };
    for (const s of subs) {
      c[badgeKindForTheme(s.theme, s.type)]++;
    }
    return c;
  }, [subs]);

  const filteredSubs = useMemo(() => {
    if (filter === "all") return subs;
    return subs.filter((s) => badgeKindForTheme(s.theme, s.type) === filter);
  }, [subs, filter]);

  const totalDeposited = balance ? formatUnits(balance.compact, balance.decimals) : "—";
  const activeCount = subs.filter((s) => s.status === "active").length;
  const greetingName = "friend";

  return (
    <div className="paper-grain" style={{ minHeight: "100vh", color: "var(--ink)" }}>
      <TopBar />

      <div style={{ padding: "40px 40px 80px", maxWidth: 1440, margin: "0 auto" }}>
        {/* Greeting */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="t-mono" style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: ".14em", textTransform: "uppercase" }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long" })} · {new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            <h1 className="t-display" style={{ fontSize: 56, margin: "8px 0 0", letterSpacing: "-.02em" }}>
              Hey <span className="t-display-it">{greetingName}</span> —
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 17, marginTop: 8 }}>
              {ready && !authenticated
                ? "Sign in to see your subscriptions."
                : activeCount > 0
                ? `Your keeper is healthy. ${activeCount} active stream${activeCount === 1 ? "" : "s"}.`
                : "Your keeper is healthy. Spin up your first recurring payment from a demo."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={triggerKeeper}
              disabled={triggering}
              className="btn btn-ghost"
            >
              {triggering ? "Ticking…" : "⚡ Trigger keeper"}
            </button>
            <Link href="/demo/streamflix" className="btn btn-plum">
              + New recurring
            </Link>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 36 }}>
          <DashStat
            label={`Total in The Compact`}
            value={totalDeposited}
            unit="USDC"
            sub="Base Sepolia · ready to pay"
          />
          <DashStat
            label="Active recurring"
            value={String(activeCount || subs.length || "—")}
            unit="streams"
            sub={subs.length > 0 ? `${subs.length} total` : "set up a demo to start"}
            spark
          />
          <DashStat
            label="Wallet USDC"
            value={balance ? formatUnits(balance.wallet, balance.decimals) : "—"}
            unit="USDC"
            sub="available to deposit"
            tone="butter"
          />
          <DashStat
            label="Saved on gas"
            value="$0"
            unit="vs manual"
            sub="all gasless after deposit"
            dark
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 8fr) minmax(360px, 4fr)", gap: 28, marginTop: 48, alignItems: "start" }}>
          {/* MAIN COLUMN */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <h2 className="t-display" style={{ fontSize: 34, margin: 0, letterSpacing: "-.02em" }}>
                Your recurring <span className="t-display-it">payments</span>
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <FilterChip
                  label={`All · ${subs.length}`}
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                <FilterChip
                  label={`Subscription · ${counts.subscription}`}
                  active={filter === "subscription"}
                  onClick={() => setFilter("subscription")}
                />
                <FilterChip
                  label={`DCA · ${counts.dca}`}
                  active={filter === "dca"}
                  onClick={() => setFilter("dca")}
                />
                <FilterChip
                  label={`Payroll · ${counts.payroll}`}
                  active={filter === "payroll"}
                  onClick={() => setFilter("payroll")}
                />
                <FilterChip
                  label={`Last Will · ${counts.lastwill}`}
                  active={filter === "lastwill"}
                  onClick={() => setFilter("lastwill")}
                />
              </div>
            </div>

            {!ready ? (
              <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-2)" }}>
                Loading wallet…
              </div>
            ) : !authenticated ? (
              <EmptyCard
                title="Connect a wallet to view your subscriptions"
                body="Recur uses Privy embedded wallets — email-based sign-in spins one up in seconds."
              />
            ) : loading && subs.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-2)" }}>
                Loading subscriptions…
              </div>
            ) : filteredSubs.length === 0 ? (
              <EmptyCard
                title={subs.length === 0 ? "No subscriptions yet" : "No subscriptions in this filter"}
                body="Try a demo: Streamflix · Payroll · Recur Stack · Last Will."
              />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {filteredSubs.map((s) => (
                  <SubscriptionCard key={s.id} subscription={s} />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "grid", gap: 18, position: "sticky", top: 24 }}>
            <DepositCard
              balance={totalDeposited}
              compactRaw={balance?.compact ?? 0n}
              decimals={balance?.decimals ?? 6}
              symbol={balance?.symbol ?? "USDC"}
            />
            <KeeperCard lastTick={lastTick} />
            <ActivityCard subs={subs} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashStat({
  label,
  value,
  unit,
  sub,
  spark,
  dark,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  spark?: boolean;
  dark?: boolean;
  tone?: "butter";
}) {
  const bg = dark ? "var(--ink)" : tone === "butter" ? "var(--butter)" : "var(--surface-1)";
  const fg = dark ? "#F6EFE5" : "var(--ink)";
  return (
    <div className="card" style={{ padding: 24, background: bg, color: fg, minHeight: 140, position: "relative" }}>
      <div className="t-mono" style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
        <span className="t-display t-num" style={{ fontSize: 48, lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: 13, opacity: 0.6 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.65 }}>{sub}</div>
      {spark ? (
        <svg width="80" height="28" viewBox="0 0 80 28" style={{ position: "absolute", right: 18, bottom: 18 }}>
          <path
            d="M0 20 L10 16 L20 18 L30 8 L40 12 L50 6 L60 10 L80 4"
            fill="none"
            stroke="var(--plum)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 0,
        padding: "8px 14px",
        borderRadius: 999,
        cursor: "pointer",
        background: active ? "var(--ink)" : "var(--surface-1)",
        color: active ? "#F6EFE5" : "var(--text-2)",
        fontFamily: "var(--f-ui)",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

function DepositCard({
  balance,
  compactRaw,
  decimals,
  symbol,
}: {
  balance: string;
  compactRaw: bigint;
  decimals: number;
  symbol: string;
}) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  return (
    <div className="card card-xl" style={{ padding: 24, background: "var(--rose)", color: "#3a1a14" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="t-mono" style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#3a1a14", opacity: 0.78 }}>
          Recur balance
        </div>
      </div>
      <div className="t-display t-num" style={{ fontSize: 56, lineHeight: 1, margin: "18px 0 4px", color: "#1A1410" }}>
        {balance}
        <span style={{ fontSize: 20, color: "rgba(26,20,16,.45)" }}> {symbol}</span>
      </div>
      <div style={{ fontSize: 13, color: "rgba(26,20,16,.7)", fontWeight: 500 }}>
        USDC on Base · The Compact
      </div>
      <Link
        href="/demo/streamflix"
        className="btn btn-lg"
        style={{ background: "#1A1410", color: "#F6EFE5", width: "100%", justifyContent: "center", marginTop: 14 }}
      >
        Start a new stream →
      </Link>
      <button
        onClick={() => setWithdrawOpen(true)}
        disabled={compactRaw === 0n}
        className="btn"
        style={{
          marginTop: 10,
          width: "100%",
          justifyContent: "center",
          background: "transparent",
          color: "#1A1410",
          border: "1px solid rgba(26,20,16,.25)",
          opacity: compactRaw === 0n ? 0.45 : 1,
          cursor: compactRaw === 0n ? "not-allowed" : "pointer",
        }}
      >
        Withdraw from Compact
      </button>
      {withdrawOpen ? (
        <WithdrawModal
          onClose={() => setWithdrawOpen(false)}
          compactRaw={compactRaw}
          decimals={decimals}
          symbol={symbol}
        />
      ) : null}
    </div>
  );
}

function WithdrawModal({
  onClose,
  compactRaw,
  decimals,
  symbol,
}: {
  onClose: () => void;
  compactRaw: bigint;
  decimals: number;
  symbol: string;
}) {
  const { getWithdrawStatus, enableWithdraw, executeWithdraw } = useRecur();
  const [status, setStatus] = useState<{ status: 0 | 1 | 2; availableAt: number } | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [busy, setBusy] = useState<"idle" | "enable" | "withdraw">("idle");
  const [amountStr, setAmountStr] = useState(() => formatUnits(compactRaw, decimals));

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const s = await getWithdrawStatus("baseSepolia");
        if (alive) setStatus(s);
      } catch (e) {
        console.error("[withdraw] status load failed", e);
      }
    }
    load();
    const t = setInterval(load, 5000);
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => {
      alive = false;
      clearInterval(t);
      clearInterval(tick);
    };
  }, [getWithdrawStatus]);

  const remaining = status ? Math.max(0, status.availableAt - now) : null;
  const ready = status?.status === 2 && (remaining ?? 1) === 0;

  async function onEnable() {
    setBusy("enable");
    try {
      await enableWithdraw("baseSepolia");
      toast.success("Withdrawal armed. Wait for the timer, then withdraw.");
      const s = await getWithdrawStatus("baseSepolia");
      setStatus(s);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("idle");
    }
  }

  async function onWithdraw() {
    setBusy("withdraw");
    try {
      const amount = parseUnits(amountStr, decimals);
      if (amount <= 0n) throw new Error("Amount must be greater than zero.");
      if (amount > compactRaw) throw new Error("Amount exceeds locked balance.");
      await executeWithdraw("baseSepolia", amount);
      toast.success(`Withdrew ${formatUnits(amount, decimals)} ${symbol} to your wallet.`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,9,8,.78)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card card-xl"
        style={{
          background: "var(--bg)",
          color: "var(--ink)",
          padding: 32,
          maxWidth: 480,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-3)" }}
          >
            Withdraw from Compact
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ background: "var(--surface-1)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="t-display" style={{ fontSize: 26, marginTop: 8 }}>
          {formatUnits(compactRaw, decimals)} {symbol}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
          Locked on Base Sepolia · 1-day forced-withdrawal timer
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
          <WithdrawStep
            n={1}
            title="Arm withdrawal"
            sub="Starts the 1-day cooldown enforced by the lock"
            done={status != null && status.status !== 0}
          />
          <WithdrawStep
            n={2}
            title={remaining ? `Cooldown · ${formatDuration(remaining)} left` : "Cooldown · ready"}
            sub={
              status?.status === 0
                ? "Not started yet"
                : ready
                ? "You can withdraw any time"
                : status
                ? `Available at ${new Date(status.availableAt * 1000).toLocaleString()}`
                : "—"
            }
            done={ready}
          />
          <WithdrawStep n={3} title="Withdraw to wallet" sub="Sends locked USDC back to your address" done={false} />
        </div>

        {ready ? (
          <div style={{ marginTop: 22 }}>
            <label
              className="t-mono"
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
              }}
            >
              Amount
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="decimal"
                style={{
                  flex: 1,
                  fontFamily: "var(--f-mono)",
                  fontSize: 18,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--surface-2)",
                  background: "var(--surface-1)",
                  color: "var(--ink)",
                }}
              />
              <button
                onClick={() => setAmountStr(formatUnits(compactRaw, decimals))}
                className="btn btn-ghost btn-sm"
              >
                Max
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
          {status?.status === 0 ? (
            <button
              onClick={onEnable}
              disabled={busy !== "idle"}
              className="btn btn-lg"
              style={{ flex: 1, background: "#1A1410", color: "#F6EFE5", justifyContent: "center" }}
            >
              {busy === "enable" ? "Arming…" : "Arm withdrawal"}
            </button>
          ) : ready ? (
            <button
              onClick={onWithdraw}
              disabled={busy !== "idle"}
              className="btn btn-lg"
              style={{ flex: 1, background: "#1A1410", color: "#F6EFE5", justifyContent: "center" }}
            >
              {busy === "withdraw" ? "Withdrawing…" : `Withdraw ${symbol} →`}
            </button>
          ) : (
            <button
              disabled
              className="btn btn-lg"
              style={{ flex: 1, justifyContent: "center", opacity: 0.5 }}
            >
              Waiting on cooldown…
            </button>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
          The Compact requires a reset-period delay before forced withdrawals so allocators
          and fillers can settle outstanding intents. Your existing locks use the 1-day reset.
        </div>
      </div>
    </div>
  );
}

function WithdrawStep({
  n,
  title,
  sub,
  done,
}: {
  n: number;
  title: string;
  sub: string;
  done: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        background: "var(--surface-1)",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: done ? "#C44A3F" : "var(--surface-2)",
          color: done ? "#F4ECDA" : "var(--text-2)",
          fontWeight: 600,
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {done ? "✓" : n}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{sub}</div>
      </div>
    </div>
  );
}

function formatDuration(sec: number): string {
  if (sec <= 0) return "0s";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function KeeperCard({ lastTick }: { lastTick: number | null }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const age = lastTick ? now - lastTick : null;
  return (
    <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--ok)", display: "grid", placeItems: "center", color: "#F6EFE5" }}>
        <IconBolt size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Keeper healthy</div>
        <div className="t-mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
          {age != null ? `last tick ${age}s ago` : "vercel cron · every 60s"}
        </div>
      </div>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>vercel/cron</span>
    </div>
  );
}

function ActivityCard({ subs }: { subs: Subscription[] }) {
  const items = useMemo(() => {
    const out: Array<{ ic: React.ReactNode; bg: string; l: string; t: string }> = [];
    for (const s of subs.slice(0, 5)) {
      const ago = ago_(s.createdAt);
      out.push({
        ic: <IconPlus size={12} stroke="#F6EFE5" />,
        bg: "var(--ink)",
        l: `New ${s.merchantName}`,
        t: ago,
      });
    }
    if (out.length === 0) {
      out.push(
        { ic: <IconCheck size={12} sw={2.5} stroke="#F6EFE5" />, bg: "var(--sage-d)", l: "Waiting for first fill", t: "—" },
        { ic: <IconChain size={12} stroke="#F6EFE5" />, bg: "var(--sage)", l: "Solver network online", t: "now" },
        { ic: <IconClock size={12} stroke="#1A1410" />, bg: "var(--butter)", l: "Keeper cron primed", t: "60s" },
        { ic: <IconDove size={12} stroke="#F6EFE5" />, bg: "var(--plum)", l: "No heartbeats logged", t: "—" },
      );
    }
    return out;
  }, [subs]);
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="t-mono" style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)" }}>
          Recent activity
        </div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: r.bg,
                color: "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {r.ic}
            </span>
            <span style={{ flex: 1, fontSize: 13 }}>{r.l}</span>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
              {r.t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card card-xl" style={{ padding: 32, textAlign: "center" }}>
      <h3 className="t-display" style={{ fontSize: 24, margin: 0 }}>
        {title}
      </h3>
      <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 8 }}>{body}</p>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <Link href="/demo/streamflix" className="btn btn-rose">
          Streamflix
        </Link>
        <Link href="/demo/payroll" className="btn btn-sage">
          Payroll
        </Link>
        <Link href="/demo/dca" className="btn btn-butter">
          Recur Stack
        </Link>
        <Link href="/demo/heir" className="btn btn-plum">
          Last Will
        </Link>
      </div>
    </div>
  );
}

function ago_(ts: number): string {
  const sec = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
