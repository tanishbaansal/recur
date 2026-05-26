import { toHex } from "viem";
import {
  ALWAYS_OK_ALLOCATOR,
  COMPACT,
  COIN_FILLER,
  INPUT_SETTLER_COMPACT_LIFI,
  getPolymerOracle,
  getChainKey,
} from "./constants";
import { ResetPeriod, toId } from "./idLib";
import { addressToBytes32 } from "./convert";
import { compactTypes } from "./compactTypes";
import type { BatchCompact, Lock, MandateOutput, StandardOrder } from "./types";

const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;

export type BuildOrderInput = {
  user: `0x${string}`;
  sourceChainId: number;
  destChainId: number;
  sourceToken: `0x${string}`;
  destToken: `0x${string}`;
  inputAmount: bigint;
  outputAmount: bigint;
  recipient: `0x${string}`;
  nonce: bigint;
  fillDeadline?: number;
  expires?: number;
  allocatorId?: string;
  resetPeriod?: ResetPeriod;
  callbackData?: `0x${string}`;
};

export type BuiltOrder = {
  order: StandardOrder;
  lockId: bigint;
};

export function buildStandardOrder(input: BuildOrderInput): BuiltOrder {
  const allocatorId = input.allocatorId ?? ALWAYS_OK_ALLOCATOR;
  const resetPeriod = input.resetPeriod ?? ResetPeriod.OneDay;
  const now = Math.floor(Date.now() / 1000);
  const fillDeadline = input.fillDeadline ?? now + 2 * ONE_HOUR;
  const expires = input.expires ?? fillDeadline + 22 * ONE_HOUR;

  const sourceChainKey = getChainKey(input.sourceChainId);
  const isSameChain = input.sourceChainId === input.destChainId;

  const lockId = toId(true, resetPeriod, allocatorId, input.sourceToken);

  const inputOracle = isSameChain
    ? (COIN_FILLER as `0x${string}`)
    : getPolymerOracle(sourceChainKey);

  const output: MandateOutput = {
    oracle: addressToBytes32(getPolymerOracle(getChainKey(input.destChainId))),
    settler: addressToBytes32(COIN_FILLER),
    chainId: BigInt(input.destChainId),
    token: addressToBytes32(input.destToken),
    amount: input.outputAmount,
    recipient: addressToBytes32(input.recipient),
    callbackData: input.callbackData ?? "0x",
    context: "0x",
  };

  const order: StandardOrder = {
    user: input.user,
    nonce: input.nonce,
    originChainId: BigInt(input.sourceChainId),
    expires,
    fillDeadline,
    inputOracle,
    inputs: [[lockId, input.inputAmount]],
    outputs: [output],
  };

  return { order, lockId };
}

export function asBatchCompact(order: StandardOrder): BatchCompact {
  const commitments: Lock[] = order.inputs.map(([tokenId, amount]) => {
    const hex = toHex(tokenId, { size: 32 });
    const lockTag = `0x${hex.slice(2, 2 + 24)}` as `0x${string}`;
    const token = `0x${hex.slice(2 + 24, 2 + 64)}` as `0x${string}`;
    return { lockTag, token, amount };
  });

  return {
    arbiter: INPUT_SETTLER_COMPACT_LIFI,
    sponsor: order.user,
    nonce: order.nonce,
    expires: BigInt(order.expires),
    commitments,
    mandate: {
      fillDeadline: order.fillDeadline,
      inputOracle: order.inputOracle,
      outputs: order.outputs,
    },
  };
}

export function getCompactDomain(chainId: number) {
  return {
    name: "The Compact",
    version: "1",
    chainId,
    verifyingContract: COMPACT,
  } as const;
}

export function getCompactTypedData(order: StandardOrder) {
  return {
    domain: getCompactDomain(Number(order.originChainId)),
    types: compactTypes,
    primaryType: "BatchCompact" as const,
    message: asBatchCompact(order),
  };
}

export function randomNonce(): bigint {
  const arr = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  let nonce = 0n;
  for (let i = 0; i < arr.length; i++) {
    nonce = (nonce << 8n) | BigInt(arr[i]);
  }
  return nonce;
}

export function getLockTagFromId(lockId: bigint): `0x${string}` {
  const hex = toHex(lockId, { size: 32 });
  return `0x${hex.slice(2, 2 + 24)}` as `0x${string}`;
}
