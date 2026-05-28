"use client";

import { useEffect, useState } from "react";
import {
  ChainChip,
  StatusChip,
  TypeBadge,
  badgeKindForTheme,
  type TypeKind,
} from "@/components/recur-ds/primitives";
import {
  IconArrow,
  IconChev,
  IconCheck,
  IconCoin,
  IconHeart,
  IconPlay,
  IconUser,
} from "@/components/recur-ds/icons";
import { CHAIN_NAME_BY_ID, EXPLORER_TX } from "@/lib/lifi/constants";
import { getOrderStatus } from "@/lib/lifi/orderServer";
import { frequencyLabel } from "@/lib/schedule";
import type { SignedIntent, Subscription } from "@/lib/lifi/types";

const ACCENT_BG: Record<TypeKind, string> = {
  subscription: "var(--rose)",
  payroll: "var(--sage)",
  dca: "var(--butter)",
  lastwill: "var(--plum)",
};
const ACCENT_FG: Record<TypeKind, string> = {
  subscription: "var(--rose-d)",
  payroll: "#3a5a35",
  dca: "#8b6c14",
  lastwill: "#F6EFE5",
};

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const [intents, setIntents] = useState<SignedIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setInterval(() => {
      if (alive) setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch(`/api/subscriptions/${subscription.id}/intents`);
      const data = await res.json();
      if (alive) {
        setIntents(data.intents ?? []);
        setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [subscription.id]);

  const kind = badgeKindForTheme(subscription.theme, subscription.type);
  const accentBg = ACCENT_BG[kind];
  const accentFg = ACCENT_FG[kind];
  const Icon = kind === "subscription" ? IconPlay : kind === "payroll" ? IconUser : kind === "dca" ? IconCoin : IconHeart;

  const fired = intents.filter((i) => i.fired).length;
  const total = subscription.periods;
  const next = intents.find((i) => !i.fired && i.fireAt > now);
  const nextLabel = nextFireLabel(subscription, next?.fireAt, now);

  const status: "pending" | "filled" | "skipped" | "failed" | "armed" =
    kind === "lastwill"
      ? subscription.heartbeat &&
        now - subscription.heartbeat.lastAt < subscription.heartbeat.thresholdSec
        ? "armed"
        : "skipped"
      : fired === total
      ? "filled"
      : "pending";

  const srcChainName = CHAIN_NAME_BY_ID[subscription.sourceChainId] ?? "base";
  const dstChainName = CHAIN_NAME_BY_ID[subscription.destChainId] ?? "arbitrum";

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 22px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: accentBg,
            color: accentFg,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
              {subscription.merchantName}
            </span>
            <TypeBadge kind={kind} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <ChainChip name={srcChainName} />
            <IconArrow size={14} stroke="var(--text-3)" />
            <ChainChip name={dstChainName} />
          </div>
        </div>
        <div style={{ minWidth: 120, textAlign: "right" }}>
          <div className="t-mono t-num" style={{ fontSize: 15, color: "var(--ink)" }}>
            {subscription.amountPerPeriod} USDC
            <span style={{ color: "var(--text-3)" }}> / {frequencyLabel(subscription.frequency)}</span>
          </div>
          <div
            className="t-mono"
            style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}
          >
            {nextLabel}
          </div>
        </div>
        <StatusChip kind={status} />
        <IconChev
          size={16}
          stroke="var(--text-3)"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
            transition: "transform .25s",
          }}
        />
      </div>
      {expanded ? (
        <div style={{ padding: "4px 22px 22px", borderTop: "1px solid var(--hairline)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 32,
              alignItems: "center",
              paddingTop: 20,
            }}
          >
            <div>
              <Label>
                Intent schedule · {fired}/{total} fired
              </Label>
              <div
                style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}
              >
                {loading
                  ? null
                  : Array.from({ length: total }).map((_, i) => {
                      const intent = intents[i];
                      const isFired = intent?.fired === true;
                      const isSkipped = intent?.status === "SkippedAlive";
                      const isNext = !isFired && i === fired;
                      return (
                        <div
                          key={i}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            background: isFired ? accentBg : "var(--surface-2)",
                            border: isNext ? "2px dashed var(--text-3)" : "0",
                            boxShadow: isFired ? "inset 0 0 0 2px " + accentBg : "none",
                            display: "grid",
                            placeItems: "center",
                          }}
                          title={
                            isFired
                              ? `Fired ${new Date((intent?.firedAt ?? 0) * 1000).toLocaleString()}`
                              : isSkipped
                              ? "Skipped (alive)"
                              : intent
                              ? `Scheduled ${new Date(intent.fireAt * 1000).toLocaleString()}`
                              : "Future"
                          }
                        >
                          {isFired ? (
                            <IconCheck size={12} sw={2.5} stroke={accentFg} />
                          ) : isSkipped ? (
                            <span style={{ color: "var(--plum)", fontSize: 12 }}>🕊</span>
                          ) : null}
                        </div>
                      );
                    })}
              </div>
            </div>
            <div>
              <Label>Next fire</Label>
              <div className="t-display t-num" style={{ fontSize: 28, lineHeight: 1, marginTop: 6 }}>
                {nextLabel}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <ExplorerButton subscription={subscription} intents={intents} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExplorerButton({
  subscription,
  intents,
}: {
  subscription: Subscription;
  intents: SignedIntent[];
}) {
  const fired = intents.find((i) => i.fired && i.onChainOrderId);
  const [loadingTx, setLoadingTx] = useState(false);
  if (!fired) return null;
  const intent = fired;
  async function handleClick() {
    setLoadingTx(true);
    try {
      const status = await getOrderStatus(subscription.sourceChainId, intent.onChainOrderId!);
      const txHash = status.data?.meta?.fillTxHash ?? status.data?.meta?.settleTxHash ?? intent.onChainOrderId;
      const baseUrl = (EXPLORER_TX as Record<number, string>)[subscription.sourceChainId];
      if (baseUrl) window.open(`${baseUrl}${txHash}`, "_blank");
    } catch {
      const baseUrl = (EXPLORER_TX as Record<number, string>)[subscription.sourceChainId];
      if (baseUrl) window.open(`${baseUrl}${intent.onChainOrderId}`, "_blank");
    } finally {
      setLoadingTx(false);
    }
  }
  return (
    <button className="btn btn-ghost btn-sm" onClick={handleClick} disabled={loadingTx}>
      {loadingTx ? "Loading…" : "View on basescan ↗"}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="t-mono"
      style={{
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--text-3)",
      }}
    >
      {children}
    </div>
  );
}

function nextFireLabel(sub: Subscription, fireAt: number | undefined, now: number): string {
  if (sub.type === "deadmans" && sub.heartbeat) {
    const remaining = sub.heartbeat.thresholdSec - (now - sub.heartbeat.lastAt);
    if (remaining > 0) return `Heartbeat OK · ${fmt(remaining)}`;
    return "Switch tripped";
  }
  if (!fireAt) return sub.status === "completed" ? "Completed" : "—";
  const delta = fireAt - now;
  if (delta <= 0) return "Due now";
  return `in ${fmt(delta)}`;
}

function fmt(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d`;
}
