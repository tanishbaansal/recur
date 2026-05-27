import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { SignedIntent, Subscription } from "./lifi/types";

type KvClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  sadd(key: string, ...members: string[]): Promise<unknown>;
  srem(key: string, ...members: string[]): Promise<unknown>;
  smembers(key: string): Promise<string[]>;
};

let kvImpl: KvClient | null = null;

function makeFileKv(): KvClient {
  const dir = join(process.cwd(), ".recur");
  const file = join(dir, "storage.json");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  function read(): { store: Record<string, unknown>; sets: Record<string, string[]> } {
    try {
      return JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      return { store: {}, sets: {} };
    }
  }

  function write(data: { store: Record<string, unknown>; sets: Record<string, string[]> }) {
    writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    async get<T>(key: string) {
      return (read().store[key] as T) ?? null;
    },
    async set(key: string, value: unknown) {
      const data = read();
      data.store[key] = value;
      write(data);
      return "OK";
    },
    async sadd(key: string, ...members: string[]) {
      const data = read();
      const s = new Set(data.sets[key] ?? []);
      for (const m of members) s.add(m);
      data.sets[key] = Array.from(s);
      write(data);
      return members.length;
    },
    async srem(key: string, ...members: string[]) {
      const data = read();
      const prev = data.sets[key];
      if (!prev) return 0;
      const s = new Set(prev);
      let removed = 0;
      for (const m of members) {
        if (s.delete(m)) removed++;
      }
      data.sets[key] = Array.from(s);
      write(data);
      return removed;
    },
    async smembers(key: string) {
      return read().sets[key] ?? [];
    },
  };
}

async function getKv(): Promise<KvClient> {
  if (kvImpl) return kvImpl;
  const hasKv = !!(process.env.KV_URL || process.env.KV_REST_API_URL);
  if (hasKv) {
    try {
      const mod = await import("@vercel/kv");
      kvImpl = mod.kv as unknown as KvClient;
      return kvImpl;
    } catch (e) {
      console.warn("Vercel KV import failed, falling back to file:", e);
    }
  }
  kvImpl = makeFileKv();
  return kvImpl;
}

const KEY = {
  sub: (id: string) => `sub:${id}`,
  subsBySponsor: (sponsor: string) => `sponsor:${sponsor.toLowerCase()}:subs`,
  intent: (id: string) => `intent:${id}`,
  intentsBySub: (subId: string) => `sub:${subId}:intents`,
  dueIntents: () => `due:intents`,
};

export async function saveSubscription(sub: Subscription): Promise<void> {
  const kv = await getKv();
  await kv.set(KEY.sub(sub.id), sub);
  await kv.sadd(KEY.subsBySponsor(sub.sponsor), sub.id);
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const kv = await getKv();
  return await kv.get<Subscription>(KEY.sub(id));
}

export async function listSubscriptionsBySponsor(sponsor: `0x${string}`): Promise<Subscription[]> {
  const kv = await getKv();
  const ids = await kv.smembers(KEY.subsBySponsor(sponsor));
  const subs = await Promise.all(ids.map((id) => kv.get<Subscription>(KEY.sub(id))));
  return subs.filter((s): s is Subscription => !!s);
}

export async function updateSubscription(sub: Subscription): Promise<void> {
  const kv = await getKv();
  await kv.set(KEY.sub(sub.id), sub);
}

export async function saveSignedIntent(intent: SignedIntent): Promise<void> {
  const kv = await getKv();
  await kv.set(KEY.intent(intent.id), intent);
  await kv.sadd(KEY.intentsBySub(intent.subscriptionId), intent.id);
  if (!intent.fired) {
    await kv.sadd(KEY.dueIntents(), intent.id);
  }
}

export async function updateSignedIntent(intent: SignedIntent): Promise<void> {
  const kv = await getKv();
  await kv.set(KEY.intent(intent.id), intent);
  if (intent.fired) {
    await kv.srem(KEY.dueIntents(), intent.id);
  }
}

export async function getSignedIntent(id: string): Promise<SignedIntent | null> {
  const kv = await getKv();
  return await kv.get<SignedIntent>(KEY.intent(id));
}

export async function listIntentsBySubscription(subId: string): Promise<SignedIntent[]> {
  const kv = await getKv();
  const ids = await kv.smembers(KEY.intentsBySub(subId));
  const intents = await Promise.all(ids.map((id) => kv.get<SignedIntent>(KEY.intent(id))));
  return intents
    .filter((i): i is SignedIntent => !!i)
    .sort((a, b) => a.fireAt - b.fireAt);
}

export async function listDueIntents(now: number = Math.floor(Date.now() / 1000)): Promise<SignedIntent[]> {
  const kv = await getKv();
  const ids = await kv.smembers(KEY.dueIntents());
  const intents = await Promise.all(ids.map((id) => kv.get<SignedIntent>(KEY.intent(id))));
  return intents
    .filter((i): i is SignedIntent => !!i && !i.fired && i.fireAt <= now)
    .sort((a, b) => a.fireAt - b.fireAt);
}
