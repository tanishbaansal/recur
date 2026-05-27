import { NextResponse } from "next/server";
import {
  listSubscriptionsBySponsor,
  saveSignedIntent,
  saveSubscription,
} from "@/lib/storage";
import type { SignedIntent, Subscription } from "@/lib/lifi/types";

type CreatePayload = {
  subscription: Subscription;
  intents: SignedIntent[];
};

export async function POST(request: Request) {
  let body: CreatePayload;
  try {
    body = (await request.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscription, intents } = body;
  if (!subscription?.id || !Array.isArray(intents)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await saveSubscription(subscription);
  for (const intent of intents) {
    await saveSignedIntent(intent);
  }

  return NextResponse.json({ ok: true, count: intents.length });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sponsor = url.searchParams.get("sponsor");
  if (!sponsor) {
    return NextResponse.json({ error: "sponsor query required" }, { status: 400 });
  }
  const subs = await listSubscriptionsBySponsor(sponsor as `0x${string}`);
  return NextResponse.json({ subscriptions: subs });
}
