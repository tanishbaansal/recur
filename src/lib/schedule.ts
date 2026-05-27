import type { SubscriptionFrequency } from "./lifi/types";

const SECONDS: Record<SubscriptionFrequency, number> = {
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
  week: 60 * 60 * 24 * 7,
  month: 60 * 60 * 24 * 30,
};

export function periodSeconds(frequency: SubscriptionFrequency): number {
  return SECONDS[frequency];
}

export function buildFireTimestamps(
  startAt: number,
  frequency: SubscriptionFrequency,
  periods: number,
): number[] {
  const step = periodSeconds(frequency);
  return Array.from({ length: periods }, (_, i) => startAt + i * step);
}

export function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return "due now";
  const d = Math.floor(secondsRemaining / 86400);
  const h = Math.floor((secondsRemaining % 86400) / 3600);
  const m = Math.floor((secondsRemaining % 3600) / 60);
  const s = secondsRemaining % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function frequencyLabel(frequency: SubscriptionFrequency): string {
  switch (frequency) {
    case "minute":
      return "every minute";
    case "hour":
      return "every hour";
    case "day":
      return "every day";
    case "week":
      return "every week";
    case "month":
      return "every month";
  }
}
