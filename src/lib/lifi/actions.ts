import {
  encodeAbiParameters,
  maxUint256,
  parseAbiParameters,
  toHex,
  type PublicClient,
  type WalletClient,
} from "viem";
import {
  ADDRESS_ZERO,
  ALWAYS_OK_ALLOCATOR,
  COMPACT,
  INPUT_SETTLER_COMPACT_LIFI,
  getChain,
  getChainKey,
} from "./constants";
import { COMPACT_ABI, ERC20_ABI, SETTLER_COMPACT_ABI } from "./abi";
import { ResetPeriod, toId } from "./idLib";
import { addressToBytes32 } from "./convert";
import type { StandardOrder } from "./types";

export type EnsureApprovalArgs = {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  token: `0x${string}`;
  spender: `0x${string}`;
  amount: bigint;
  chainId: number;
};

export async function ensureErc20Approval({
  walletClient,
  publicClient,
  account,
  token,
  spender,
  amount,
  chainId,
}: EnsureApprovalArgs): Promise<`0x${string}` | null> {
  const current = (await publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account, spender],
  })) as bigint;
  if (current >= amount) return null;

  const hash = await walletClient.writeContract({
    chain: getChain(chainId),
    account,
    address: token,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, maxUint256],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export type CompactDepositArgs = {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  chainId: number;
  allocatorId?: string;
  resetPeriod?: ResetPeriod;
};

export async function compactDeposit({
  walletClient,
  publicClient,
  account,
  token,
  amount,
  chainId,
  allocatorId = ALWAYS_OK_ALLOCATOR,
  resetPeriod = ResetPeriod.OneDay,
}: CompactDepositArgs): Promise<{ approvalHash: `0x${string}` | null; depositHash: `0x${string}` }> {
  const isNative = token.toLowerCase() === ADDRESS_ZERO;

  let approvalHash: `0x${string}` | null = null;
  if (!isNative) {
    approvalHash = await ensureErc20Approval({
      walletClient,
      publicClient,
      account,
      token,
      spender: COMPACT,
      amount,
      chainId,
    });
  }

  const lockId = toId(true, resetPeriod, allocatorId, token);
  const lockTagHex = toHex(lockId, { size: 32 }).slice(2, 2 + 24);
  const lockTag = `0x${lockTagHex}` as `0x${string}`;

  let depositHash: `0x${string}`;
  if (isNative) {
    depositHash = await walletClient.writeContract({
      chain: getChain(chainId),
      account,
      address: COMPACT,
      abi: COMPACT_ABI,
      functionName: "depositNative",
      value: amount,
      args: [lockTag, ADDRESS_ZERO],
    });
  } else {
    depositHash = await walletClient.writeContract({
      chain: getChain(chainId),
      account,
      address: COMPACT,
      abi: COMPACT_ABI,
      functionName: "depositERC20",
      args: [token, lockTag, amount, ADDRESS_ZERO],
    });
  }
  await publicClient.waitForTransactionReceipt({ hash: depositHash });

  return { approvalHash, depositHash };
}

export async function readCompactBalance(
  publicClient: PublicClient,
  account: `0x${string}`,
  token: `0x${string}`,
  allocatorId: string = ALWAYS_OK_ALLOCATOR,
  resetPeriod: ResetPeriod = ResetPeriod.OneDay,
): Promise<bigint> {
  const lockId = toId(true, resetPeriod, allocatorId, token);
  const balance = (await publicClient.readContract({
    address: COMPACT,
    abi: COMPACT_ABI,
    functionName: "balanceOf",
    args: [account, lockId],
  })) as bigint;
  return balance;
}

export type ForcedWithdrawalStatus = {
  status: 0 | 1 | 2; // 0 Disabled, 1 Pending, 2 Enabled
  availableAt: number;
};

export async function readForcedWithdrawalStatus(
  publicClient: PublicClient,
  account: `0x${string}`,
  token: `0x${string}`,
  allocatorId: string = ALWAYS_OK_ALLOCATOR,
  resetPeriod: ResetPeriod = ResetPeriod.OneDay,
): Promise<ForcedWithdrawalStatus> {
  const lockId = toId(true, resetPeriod, allocatorId, token);
  const [status, availableAt] = (await publicClient.readContract({
    address: COMPACT,
    abi: COMPACT_ABI,
    functionName: "getForcedWithdrawalStatus",
    args: [account, lockId],
  })) as [number, bigint];
  return {
    status: status as 0 | 1 | 2,
    availableAt: Number(availableAt),
  };
}

export async function enableCompactForcedWithdrawal({
  walletClient,
  publicClient,
  account,
  token,
  chainId,
  allocatorId = ALWAYS_OK_ALLOCATOR,
  resetPeriod = ResetPeriod.OneDay,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  token: `0x${string}`;
  chainId: number;
  allocatorId?: string;
  resetPeriod?: ResetPeriod;
}): Promise<{ hash: `0x${string}`; lockId: bigint }> {
  const lockId = toId(true, resetPeriod, allocatorId, token);
  const hash = await walletClient.writeContract({
    chain: getChain(chainId),
    account,
    address: COMPACT,
    abi: COMPACT_ABI,
    functionName: "enableForcedWithdrawal",
    args: [lockId],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, lockId };
}

export async function executeCompactForcedWithdrawal({
  walletClient,
  publicClient,
  account,
  token,
  recipient,
  amount,
  chainId,
  allocatorId = ALWAYS_OK_ALLOCATOR,
  resetPeriod = ResetPeriod.OneDay,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  token: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  chainId: number;
  allocatorId?: string;
  resetPeriod?: ResetPeriod;
}): Promise<{ hash: `0x${string}` }> {
  const lockId = toId(true, resetPeriod, allocatorId, token);
  const hash = await walletClient.writeContract({
    chain: getChain(chainId),
    account,
    address: COMPACT,
    abi: COMPACT_ABI,
    functionName: "forcedWithdrawal",
    args: [lockId, recipient, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { hash };
}

export async function disableCompactForcedWithdrawal({
  walletClient,
  publicClient,
  account,
  token,
  chainId,
  allocatorId = ALWAYS_OK_ALLOCATOR,
  resetPeriod = ResetPeriod.OneDay,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  token: `0x${string}`;
  chainId: number;
  allocatorId?: string;
  resetPeriod?: ResetPeriod;
}): Promise<{ hash: `0x${string}` }> {
  const lockId = toId(true, resetPeriod, allocatorId, token);
  const hash = await walletClient.writeContract({
    chain: getChain(chainId),
    account,
    address: COMPACT,
    abi: COMPACT_ABI,
    functionName: "disableForcedWithdrawal",
    args: [lockId],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { hash };
}

export async function readErc20Balance(
  publicClient: PublicClient,
  account: `0x${string}`,
  token: `0x${string}`,
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;
}

export function combineCompactSignatures(
  sponsorSig: `0x${string}`,
  allocatorSig: `0x${string}` = "0x",
): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("bytes, bytes"), [sponsorSig, allocatorSig]);
}

export type FinaliseArgs = {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: `0x${string}`;
  order: StandardOrder;
  sponsorSignature: `0x${string}`;
  allocatorSignature?: `0x${string}`;
  solveParams: { timestamp: number; solver: `0x${string}` }[];
};

export async function finaliseCompactOrder({
  walletClient,
  publicClient,
  account,
  order,
  sponsorSignature,
  allocatorSignature = "0x",
  solveParams,
}: FinaliseArgs): Promise<`0x${string}`> {
  const combined = combineCompactSignatures(sponsorSignature, allocatorSignature);
  const hash = await walletClient.writeContract({
    chain: getChain(Number(order.originChainId)),
    account,
    address: INPUT_SETTLER_COMPACT_LIFI,
    abi: SETTLER_COMPACT_ABI,
    functionName: "finalise",
    args: [
      order,
      combined,
      solveParams.map((p) => ({
        timestamp: p.timestamp,
        solver: addressToBytes32(p.solver),
      })),
      addressToBytes32(account),
      "0x",
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export { getChainKey };
