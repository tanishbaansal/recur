import { getAddress, hexToBigInt } from "viem";

export enum ResetPeriod {
  OneSecond = 0,
  FifteenSeconds = 1,
  OneMinute = 2,
  TenMinutes = 3,
  OneHourAndFiveMinutes = 4,
  OneDay = 5,
  SevenDaysAndOneHour = 6,
  ThirtyDays = 7,
}

export function toId(
  inputChains: boolean,
  resetPeriod: number,
  allocatorId: string,
  token: string,
): bigint {
  if (resetPeriod < 0 || resetPeriod > 7) {
    throw new Error("Reset period must be between 0 and 7");
  }
  const normalizedToken = getAddress(token);

  const scope = inputChains ? 0n : 1n;
  const allocatorBigInt = BigInt(allocatorId);
  if (allocatorBigInt > (1n << 92n) - 1n) {
    throw new Error("AllocatorId must fit in 92 bits");
  }
  const tokenBigInt = hexToBigInt(normalizedToken);

  const scopeBits = scope << 255n;
  const resetPeriodBits = BigInt(resetPeriod) << 252n;
  const allocatorBits = allocatorBigInt << 160n;

  return scopeBits | resetPeriodBits | allocatorBits | tokenBigInt;
}
