"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";
import { getViemWalletClient } from "@/lib/privy/walletClient";

export type HeartbeatState = { lastAt: number; thresholdSec: number } | null;

export function useHeartbeat(subscriptionId: string | null, sponsor: `0x${string}` | undefined) {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const [heartbeat, setHeartbeat] = useState<HeartbeatState>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!subscriptionId) return null;
    try {
      const res = await fetch(`/api/heartbeat?subscriptionId=${subscriptionId}`);
      const data = await res.json();
      return (data.heartbeat ?? null) as HeartbeatState;
    } catch {
      return null;
    }
  }, [subscriptionId]);

  useEffect(() => {
    if (!subscriptionId) return;
    let alive = true;
    async function load() {
      const hb = await refresh();
      if (alive) setHeartbeat(hb);
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refresh, subscriptionId]);

  const checkIn = useCallback(async () => {
    if (!wallet || !sponsor || !subscriptionId) {
      setErr("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const ts = Math.floor(Date.now() / 1000);
      const message = `Recur heartbeat: ${subscriptionId}:${ts}`;
      const wc = await getViemWalletClient(wallet, baseSepolia.id);
      const signature = await wc.signMessage({ account: sponsor, message });
      const res = await fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, message, signature }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Heartbeat failed: ${text}`);
      }
      const hb = await refresh();
      setHeartbeat(hb);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, sponsor, subscriptionId, refresh]);

  return { heartbeat, busy, err, checkIn, walletReady: !!wallet };
}

export function formatRemaining(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d`;
}

export function formatHMS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (d > 0) return `${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss
    .toString()
    .padStart(2, "0")}`;
}
