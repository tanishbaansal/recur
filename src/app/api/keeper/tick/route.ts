import { NextResponse } from "next/server";
import { getSubscription, listDueIntents, updateSignedIntent } from "@/lib/storage";
import { submitOrder } from "@/lib/lifi/orderServer";
import { deserializeOrder } from "@/lib/lifi/convert";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (request.headers.get("x-vercel-cron")) return true;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return true;
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await listDueIntents();
  const results: {
    intentId: string;
    status: "fired" | "failed" | "skipped-alive";
    onChainOrderId?: string;
    error?: string;
  }[] = [];

  for (const intent of due) {
    try {
      const sub = await getSubscription(intent.subscriptionId);
      if (sub?.type === "deadmans" && sub.heartbeat) {
        const now = Math.floor(Date.now() / 1000);
        const alive = now - sub.heartbeat.lastAt < sub.heartbeat.thresholdSec;
        if (alive) {
          await updateSignedIntent({ ...intent, status: "SkippedAlive" });
          results.push({ intentId: intent.id, status: "skipped-alive" });
          continue;
        }
      }
      const order = deserializeOrder(intent.order);
      const res = await submitOrder({
        order,
        sponsorSignature: intent.sponsorSignature,
        inputSettler: intent.inputSettler,
      });
      const updated = {
        ...intent,
        fired: true,
        firedAt: Math.floor(Date.now() / 1000),
        onChainOrderId: res.onChainOrderId,
        status: (res.orderStatus ?? "Signed") as typeof intent.status,
      };
      await updateSignedIntent(updated);
      results.push({
        intentId: intent.id,
        status: "fired",
        onChainOrderId: res.onChainOrderId,
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      await updateSignedIntent({
        ...intent,
        fired: true,
        firedAt: Math.floor(Date.now() / 1000),
        status: "Pending",
      });
      results.push({ intentId: intent.id, status: "failed", error: err });
    }
  }

  return NextResponse.json({
    fired: results.filter((r) => r.status === "fired").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped-alive").length,
    results,
  });
}
