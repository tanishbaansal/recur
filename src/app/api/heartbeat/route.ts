import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { getSubscription, updateSubscription } from "@/lib/storage";

type HeartbeatPayload = {
  subscriptionId: string;
  message: string;
  signature: `0x${string}`;
};

const MAX_DRIFT_SEC = 300;

export async function POST(request: Request) {
  let body: HeartbeatPayload;
  try {
    body = (await request.json()) as HeartbeatPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscriptionId, message, signature } = body;
  if (!subscriptionId || !message || !signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const match = /^Recur heartbeat: ([^:]+):(\d+)$/.exec(message);
  if (!match || match[1] !== subscriptionId) {
    return NextResponse.json({ error: "Bad message format" }, { status: 400 });
  }
  const ts = Number(match[2]);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_DRIFT_SEC) {
    return NextResponse.json({ error: "Stale timestamp" }, { status: 400 });
  }

  const sub = await getSubscription(subscriptionId);
  if (!sub) return NextResponse.json({ error: "Unknown subscription" }, { status: 404 });
  if (sub.type !== "deadmans" || !sub.heartbeat) {
    return NextResponse.json({ error: "Not a deadmans subscription" }, { status: 400 });
  }

  const valid = await verifyMessage({ address: sub.sponsor, message, signature });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  await updateSubscription({
    ...sub,
    heartbeat: { ...sub.heartbeat, lastAt: now },
  });

  return NextResponse.json({ ok: true, lastAt: now });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("subscriptionId");
  if (!id) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  const sub = await getSubscription(id);
  if (!sub) return NextResponse.json({ error: "Unknown subscription" }, { status: 404 });
  return NextResponse.json({ heartbeat: sub.heartbeat ?? null, type: sub.type ?? "payment" });
}
