export type MandateOutput = {
  oracle: `0x${string}`;
  settler: `0x${string}`;
  chainId: bigint;
  token: `0x${string}`;
  amount: bigint;
  recipient: `0x${string}`;
  callbackData: `0x${string}`;
  context: `0x${string}`;
};

export type StandardOrder = {
  user: `0x${string}`;
  nonce: bigint;
  originChainId: bigint;
  expires: number;
  fillDeadline: number;
  inputOracle: `0x${string}`;
  inputs: [bigint, bigint][];
  outputs: MandateOutput[];
};

export type Lock = {
  lockTag: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
};

export type Mandate = {
  fillDeadline: number;
  inputOracle: `0x${string}`;
  outputs: MandateOutput[];
};

export type BatchCompact = {
  arbiter: `0x${string}`;
  sponsor: `0x${string}`;
  nonce: bigint;
  expires: bigint;
  commitments: Lock[];
  mandate: Mandate;
};

export type OrderStatus = "Signed" | "Delivered" | "Settled" | "Refunded" | "Expired";

export type SubscriptionFrequency = "minute" | "hour" | "day" | "week" | "month";

export type SubscriptionType = "payment" | "dca" | "deadmans";

export type HeartbeatState = {
  lastAt: number;
  thresholdSec: number;
};

export type Subscription = {
  id: string;
  sponsor: `0x${string}`;
  merchantName: string;
  merchantAddress: `0x${string}`;
  sourceChainId: number;
  destChainId: number;
  sourceToken: `0x${string}`;
  destToken: `0x${string}`;
  amountPerPeriod: string;
  frequency: SubscriptionFrequency;
  periods: number;
  createdAt: number;
  status: "active" | "cancelled" | "completed";
  theme?: "streamflix" | "payroll" | "neutral" | "dca" | "heir";
  type?: SubscriptionType;
  heartbeat?: HeartbeatState;
};

export type SignedIntent = {
  id: string;
  subscriptionId: string;
  sponsor: `0x${string}`;
  fireAt: number;
  fired: boolean;
  firedAt?: number;
  onChainOrderId?: `0x${string}`;
  order: SerializableStandardOrder;
  sponsorSignature: `0x${string}`;
  status: OrderStatus | "Pending" | "SkippedAlive";
  inputSettler: `0x${string}`;
};

export type SerializableStandardOrder = {
  user: `0x${string}`;
  nonce: string;
  originChainId: string;
  expires: number;
  fillDeadline: number;
  inputOracle: `0x${string}`;
  inputs: [string, string][];
  outputs: SerializableMandateOutput[];
};

export type SerializableMandateOutput = {
  oracle: `0x${string}`;
  settler: `0x${string}`;
  chainId: string;
  token: `0x${string}`;
  amount: string;
  recipient: `0x${string}`;
  callbackData: `0x${string}`;
  context: `0x${string}`;
};
