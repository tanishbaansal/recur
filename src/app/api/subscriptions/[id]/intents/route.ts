import { NextResponse } from "next/server";
import { listIntentsBySubscription } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const intents = await listIntentsBySubscription(id);
  return NextResponse.json({ intents });
}
