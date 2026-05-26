import { getAddress, hexToBigInt } from "viem";
import type {
  MandateOutput,
  SerializableMandateOutput,
  SerializableStandardOrder,
  StandardOrder,
} from "./types";

export function addressToBytes32(address: `0x${string}`): `0x${string}` {
  const cleaned = address.replace("0x", "");
  if (cleaned.length !== 40) {
    throw new Error(`Invalid address length: ${address.length}`);
  }
  return `0x${cleaned.padStart(64, "0")}`;
}

export function bytes32ToAddress(bytes: `0x${string}`): `0x${string}` {
  const cleaned = bytes.replace("0x", "");
  if (cleaned.length !== 64) {
    throw new Error(`Invalid bytes32 length: ${bytes.length}`);
  }
  return getAddress(`0x${cleaned.slice(24, 64)}` as `0x${string}`);
}

export function idToToken(id: bigint): `0x${string}` {
  const hex = `0x${id.toString(16).padStart(64, "0")}` as `0x${string}`;
  return bytes32ToAddress(hex);
}

export function idToLockTag(id: bigint): `0x${string}` {
  const hex = id.toString(16).padStart(64, "0");
  return `0x${hex.slice(0, 24)}` as `0x${string}`;
}

export function tokenIdToBigInt(tokenAddress: `0x${string}`): bigint {
  return hexToBigInt(tokenAddress);
}

export function serializeOrder(order: StandardOrder): SerializableStandardOrder {
  return {
    user: order.user,
    nonce: order.nonce.toString(),
    originChainId: order.originChainId.toString(),
    expires: order.expires,
    fillDeadline: order.fillDeadline,
    inputOracle: order.inputOracle,
    inputs: order.inputs.map(([a, b]) => [a.toString(), b.toString()]),
    outputs: order.outputs.map(serializeMandateOutput),
  };
}

export function serializeMandateOutput(o: MandateOutput): SerializableMandateOutput {
  return {
    oracle: o.oracle,
    settler: o.settler,
    chainId: o.chainId.toString(),
    token: o.token,
    amount: o.amount.toString(),
    recipient: o.recipient,
    callbackData: o.callbackData,
    context: o.context,
  };
}

export function deserializeOrder(order: SerializableStandardOrder): StandardOrder {
  return {
    user: order.user,
    nonce: BigInt(order.nonce),
    originChainId: BigInt(order.originChainId),
    expires: order.expires,
    fillDeadline: order.fillDeadline,
    inputOracle: order.inputOracle,
    inputs: order.inputs.map(([a, b]) => [BigInt(a), BigInt(b)] as [bigint, bigint]),
    outputs: order.outputs.map((o) => ({
      oracle: o.oracle,
      settler: o.settler,
      chainId: BigInt(o.chainId),
      token: o.token,
      amount: BigInt(o.amount),
      recipient: o.recipient,
      callbackData: o.callbackData,
      context: o.context,
    })),
  };
}

export function trunc(value: string, length: number = 6): string {
  const cleaned = value.replace("0x", "");
  return `0x${cleaned.slice(0, length)}…${cleaned.slice(-length)}`;
}
