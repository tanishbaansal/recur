import { getOrderServerUrl, INPUT_SETTLER_COMPACT_LIFI } from "./constants";
import { serializeOrder } from "./convert";
import type { OrderStatus, SerializableStandardOrder, StandardOrder } from "./types";

export type QuoteRequest = {
  user: `0x${string}`;
  inputChainId: number;
  outputChainId: number;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
  inputAmount?: bigint;
  outputAmount?: bigint;
  receiver: `0x${string}`;
  swapType?: "exact-input" | "exact-output";
  supportedTypes?: ("oif-escrow-v0" | "oif-resource-lock-v0")[];
  minValidUntil?: number;
};

export type QuotePreview = {
  inputs: { user: `0x${string}`; asset: `0x${string}`; amount: string }[];
  outputs: { receiver: `0x${string}`; asset: `0x${string}`; amount: string }[];
};

export type QuoteResult = {
  preview: QuotePreview;
  metadata?: { exclusiveFor?: `0x${string}` | `0x${string}`[] };
  validUntil?: number | null;
  quoteId?: string | null;
  eta?: number | null;
  provider?: string | null;
  partialFill?: boolean;
};

export type QuoteResponse = {
  quotes: QuoteResult[];
};

export type SubmitOrderInput = {
  order: StandardOrder;
  sponsorSignature: `0x${string}`;
  allocatorSignature?: `0x${string}`;
  inputSettler?: `0x${string}`;
};

export type SubmitOrderResponse = {
  onChainOrderId?: `0x${string}`;
  orderIdentifier?: string;
  orderStatus?: OrderStatus;
  [k: string]: unknown;
};

export type OrderStatusResponse = {
  data?: {
    order?: SerializableStandardOrder;
    inputSettler?: `0x${string}`;
    sponsorSignature?: `0x${string}` | null;
    allocatorSignature?: `0x${string}` | null;
    meta?: {
      submitTime?: number;
      orderStatus?: OrderStatus;
      destinationAddress?: `0x${string}`;
      orderIdentifier?: string;
      onChainOrderId?: `0x${string}`;
      signedAt?: string;
      expiredAt?: string | null;
      fillTxHash?: `0x${string}` | null;
      settleTxHash?: `0x${string}` | null;
    };
  };
  [k: string]: unknown;
};

function baseUrl(chainId: number): string {
  return getOrderServerUrl(chainId);
}

export async function requestQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const url = `${baseUrl(req.inputChainId)}/quote/request`;

  const body = {
    user: req.user,
    inputs: [
      {
        sender: req.user,
        asset: req.inputToken,
        chainId: req.inputChainId,
        amount: req.inputAmount ? req.inputAmount.toString() : null,
      },
    ],
    outputs: [
      {
        receiver: req.receiver,
        asset: req.outputToken,
        chainId: req.outputChainId,
        amount: req.outputAmount ? req.outputAmount.toString() : null,
      },
    ],
    swapType: req.swapType ?? "exact-input",
    supportedTypes: req.supportedTypes ?? ["oif-resource-lock-v0", "oif-escrow-v0"],
    ...(req.minValidUntil ? { minValidUntil: req.minValidUntil } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Quote request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as QuoteResponse;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResponse> {
  const url = `${baseUrl(Number(input.order.originChainId))}/orders/submit`;
  const body = {
    orderType: "CatalystCompactOrder",
    order: serializeOrder(input.order),
    inputSettler: input.inputSettler ?? INPUT_SETTLER_COMPACT_LIFI,
    sponsorSignature: input.sponsorSignature,
    ...(input.allocatorSignature ? { allocatorSignature: input.allocatorSignature } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Order submit failed (${res.status}): ${text}`);
  }
  return (await res.json()) as SubmitOrderResponse;
}

export async function getOrderStatus(
  chainId: number,
  onChainOrderId: `0x${string}`,
): Promise<OrderStatusResponse> {
  const url = `${baseUrl(chainId)}/orders/status?onChainOrderId=${onChainOrderId}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Status fetch failed (${res.status}): ${text}`);
  }
  return (await res.json()) as OrderStatusResponse;
}

export async function listOrders(
  chainId: number,
  params: { user?: `0x${string}`; status?: OrderStatus; limit?: number; offset?: number } = {},
): Promise<unknown> {
  const usp = new URLSearchParams();
  usp.set("limit", String(params.limit ?? 50));
  usp.set("offset", String(params.offset ?? 0));
  if (params.user) usp.set("user", params.user);
  if (params.status) usp.set("status", params.status);
  const url = `${baseUrl(chainId)}/orders?${usp.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Orders list failed (${res.status}): ${text}`);
  }
  return await res.json();
}
