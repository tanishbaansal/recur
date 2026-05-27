"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { parseUnits } from "viem";
import {
  ALWAYS_OK_ALLOCATOR,
  INPUT_SETTLER_COMPACT_LIFI,
  TOKENS,
  type SupportedChainKey,
} from "@/lib/lifi/constants";
import {
  asBatchCompact,
  buildStandardOrder,
  getCompactTypedData,
  randomNonce,
} from "@/lib/lifi/compact";
import {
  compactDeposit,
  enableCompactForcedWithdrawal,
  executeCompactForcedWithdrawal,
  readCompactBalance,
  readErc20Balance,
  readForcedWithdrawalStatus,
  type ForcedWithdrawalStatus,
} from "@/lib/lifi/actions";
import { ResetPeriod } from "@/lib/lifi/idLib";
import { serializeOrder } from "@/lib/lifi/convert";
import { getViemWalletClient } from "@/lib/privy/walletClient";
import { getPublicClient } from "@/lib/viem";
import { buildFireTimestamps, periodSeconds } from "@/lib/schedule";
import type {
  SignedIntent,
  Subscription,
  SubscriptionFrequency,
  SubscriptionType,
} from "@/lib/lifi/types";

export type CreateSubscriptionInput = {
  merchantName: string;
  merchantAddress: `0x${string}`;
  sourceChainKey: SupportedChainKey;
  destChainKey: SupportedChainKey;
  amountPerPeriod: string;
  frequency: SubscriptionFrequency;
  periods: number;
  firstFireDelaySec?: number;
  theme?: Subscription["theme"];
  type?: SubscriptionType;
  heartbeatThresholdSec?: number;
};

export type StepStatus = "idle" | "running" | "done" | "error";

export type ProgressState = {
  approve: StepStatus;
  deposit: StepStatus;
  sign: { total: number; signed: number; status: StepStatus };
  save: StepStatus;
  error?: string;
};

const INITIAL_PROGRESS: ProgressState = {
  approve: "idle",
  deposit: "idle",
  sign: { total: 0, signed: 0, status: "idle" },
  save: "idle",
};

export function useRecur() {
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [busy, setBusy] = useState(false);

  const wallet = wallets[0];
  const address = (user?.wallet?.address ?? wallet?.address) as `0x${string}` | undefined;

  const reset = useCallback(() => setProgress(INITIAL_PROGRESS), []);

  const getBalances = useCallback(
    async (sourceChainKey: SupportedChainKey) => {
      if (!address) return null;
      const token = TOKENS[`usdc:${sourceChainKey}`];
      const publicClient = getPublicClient(token.chainId);
      const [wallet, compact] = await Promise.all([
        readErc20Balance(publicClient, address, token.address),
        readCompactBalance(publicClient, address, token.address),
      ]);
      return {
        token,
        walletBalance: wallet,
        compactBalance: compact,
      };
    },
    [address],
  );

  const subscribe = useCallback(
    async (input: CreateSubscriptionInput): Promise<{ subscription: Subscription }> => {
      if (!ready || !authenticated || !wallet || !address) {
        throw new Error("Wallet not connected — sign in and wait a moment, then retry.");
      }

      setBusy(true);
      setProgress({
        approve: "idle",
        deposit: "idle",
        sign: { total: input.periods, signed: 0, status: "idle" },
        save: "idle",
      });

      try {
        const srcToken = TOKENS[`usdc:${input.sourceChainKey}`];
        const dstToken = TOKENS[`usdc:${input.destChainKey}`];
        const periodAmount = parseUnits(input.amountPerPeriod, srcToken.decimals);
        const totalNeeded = periodAmount * BigInt(input.periods);

        const publicClient = getPublicClient(srcToken.chainId);

        const lockedBalance = await readCompactBalance(
          publicClient,
          address,
          srcToken.address,
        );

        const needsDeposit = lockedBalance < totalNeeded;
        const depositAmount = needsDeposit ? totalNeeded - lockedBalance : 0n;

        if (needsDeposit) {
          setProgress((p) => ({ ...p, approve: "running" }));
          const walletClient = await getViemWalletClient(wallet, srcToken.chainId);
          setProgress((p) => ({ ...p, approve: "done", deposit: "running" }));
          await compactDeposit({
            walletClient,
            publicClient,
            account: address,
            token: srcToken.address,
            amount: depositAmount,
            chainId: srcToken.chainId,
            allocatorId: ALWAYS_OK_ALLOCATOR,
            resetPeriod: ResetPeriod.OneDay,
          });
          setProgress((p) => ({ ...p, deposit: "done" }));
        } else {
          setProgress((p) => ({ ...p, approve: "done", deposit: "done" }));
        }

        const now = Math.floor(Date.now() / 1000);
        const startAt = now + (input.firstFireDelaySec ?? 60);
        const fireTimes = buildFireTimestamps(startAt, input.frequency, input.periods);

        setProgress((p) => ({
          ...p,
          sign: { ...p.sign, status: "running" },
        }));

        const walletClient = await getViemWalletClient(wallet, srcToken.chainId);
        const subscriptionId = cryptoRandomId();
        const signedIntents: SignedIntent[] = [];

        for (let i = 0; i < fireTimes.length; i++) {
          const fireAt = fireTimes[i];
          const nonce = randomNonce();
          const { order } = buildStandardOrder({
            user: address,
            sourceChainId: srcToken.chainId,
            destChainId: dstToken.chainId,
            sourceToken: srcToken.address,
            destToken: dstToken.address,
            inputAmount: periodAmount,
            outputAmount: periodAmount,
            recipient: input.merchantAddress,
            nonce,
            fillDeadline: fireAt + 2 * 60 * 60,
            expires: fireAt + 24 * 60 * 60,
          });

          const typed = getCompactTypedData(order);
          const signature = await walletClient.signTypedData({
            account: address,
            domain: typed.domain,
            types: typed.types,
            primaryType: typed.primaryType,
            message: asBatchCompact(order),
          });

          signedIntents.push({
            id: `${subscriptionId}:${i}`,
            subscriptionId,
            sponsor: address,
            fireAt,
            fired: false,
            order: serializeOrder(order),
            sponsorSignature: signature as `0x${string}`,
            status: "Pending",
            inputSettler: INPUT_SETTLER_COMPACT_LIFI,
          });

          setProgress((p) => ({
            ...p,
            sign: { ...p.sign, signed: i + 1 },
          }));
        }

        setProgress((p) => ({
          ...p,
          sign: { ...p.sign, status: "done" },
          save: "running",
        }));

        const subscription: Subscription = {
          id: subscriptionId,
          sponsor: address,
          merchantName: input.merchantName,
          merchantAddress: input.merchantAddress,
          sourceChainId: srcToken.chainId,
          destChainId: dstToken.chainId,
          sourceToken: srcToken.address,
          destToken: dstToken.address,
          amountPerPeriod: input.amountPerPeriod,
          frequency: input.frequency,
          periods: input.periods,
          createdAt: now,
          status: "active",
          theme: input.theme,
          type: input.type ?? "payment",
          heartbeat:
            input.type === "deadmans"
              ? { lastAt: now, thresholdSec: input.heartbeatThresholdSec ?? 30 * 24 * 60 * 60 }
              : undefined,
        };

        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription, intents: signedIntents }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to save subscription: ${text}`);
        }

        setProgress((p) => ({ ...p, save: "done" }));
        return { subscription };
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        // Surface the real error so "Unknown connector error" toasts are diagnosable.
        console.error("[useRecur.subscribe] failed:", e);
        if (e instanceof Error && e.cause) {
          console.error("[useRecur.subscribe] cause:", e.cause);
        }
        setProgress((p) => ({ ...p, error: err }));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [ready, authenticated, wallet, address],
  );

  const getWithdrawStatus = useCallback(
    async (chainKey: SupportedChainKey): Promise<ForcedWithdrawalStatus | null> => {
      if (!address) return null;
      const token = TOKENS[`usdc:${chainKey}`];
      const publicClient = getPublicClient(token.chainId);
      return readForcedWithdrawalStatus(
        publicClient,
        address,
        token.address,
        ALWAYS_OK_ALLOCATOR,
        ResetPeriod.OneDay,
      );
    },
    [address],
  );

  const enableWithdraw = useCallback(
    async (chainKey: SupportedChainKey) => {
      if (!ready || !authenticated || !wallet || !address) {
        throw new Error("Wallet not connected.");
      }
      const token = TOKENS[`usdc:${chainKey}`];
      const publicClient = getPublicClient(token.chainId);
      const walletClient = await getViemWalletClient(wallet, token.chainId);
      const { hash } = await enableCompactForcedWithdrawal({
        walletClient,
        publicClient,
        account: address,
        token: token.address,
        chainId: token.chainId,
      });
      return { hash };
    },
    [ready, authenticated, wallet, address],
  );

  const executeWithdraw = useCallback(
    async (chainKey: SupportedChainKey, amount: bigint) => {
      if (!ready || !authenticated || !wallet || !address) {
        throw new Error("Wallet not connected.");
      }
      const token = TOKENS[`usdc:${chainKey}`];
      const publicClient = getPublicClient(token.chainId);
      const walletClient = await getViemWalletClient(wallet, token.chainId);
      const { hash } = await executeCompactForcedWithdrawal({
        walletClient,
        publicClient,
        account: address,
        token: token.address,
        recipient: address,
        amount,
        chainId: token.chainId,
      });
      return { hash };
    },
    [ready, authenticated, wallet, address],
  );

  return useMemo(
    () => ({
      address,
      authenticated,
      busy,
      progress,
      reset,
      subscribe,
      getBalances,
      getWithdrawStatus,
      enableWithdraw,
      executeWithdraw,
      periodSeconds,
    }),
    [
      address,
      authenticated,
      busy,
      progress,
      reset,
      subscribe,
      getBalances,
      getWithdrawStatus,
      enableWithdraw,
      executeWithdraw,
    ],
  );
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
