# Recur — Set-and-forget cross-chain payments

<img width="1200" height="985" alt="Recur cover" src="https://github.com/user-attachments/assets/d74977c8-83ca-46c0-ad6c-5bd50628cc07" />

&nbsp;

> **Submission for the LI.FI Intents Mini Builder Challenge.**
> Recur turns LI.FI's Compact resource-lock flow into the first truly usable recurring crypto payments: deposit USDC once on Base, pay anyone on any chain via gasless EIP-712 intents, auto-renewing on a schedule.


🔗 **Live:** [recur-lifi.vercel.app](https://recur-lifi.vercel.app)

🎬 **Video walkthrough:** [youtu.be/eTXVBZZcWpY](https://youtu.be/eTXVBZZcWpY)

🧵 **Submission thread:** [x.com/snaked06/status/2059975135759900688](https://x.com/snaked06/status/2059975135759900688)


## TL;DR

- **Deposit once** into Uniswap's `The Compact` on Base — one on-chain transaction.
- **Sign N future intents up front** (EIP-712 `BatchCompact`) — gasless, takes seconds.
- **A keeper submits each intent on schedule** to `https://order.li.fi/orders/submit` (testnet uses `https://order-dev.li.fi`).
- **LI.FI's solver network fills on the destination chain** in ~22 seconds per payment.
- **You pay zero gas after the deposit** for the entire subscription lifetime.

Four end-to-end demos ship in this repo:

1. **Streamflix** (`/demo/streamflix`) — pixel-perfect Netflix-style subscription checkout. Email login via Privy → monthly cross-chain payment. The hero story.
2. **Payroll** (`/demo/payroll`) — B2B flow paying a distributed team across multiple chains from a single deposit. Animated polar map shows each employee snap onto their preferred chain.
3. **Recur Stack** (`/demo/dca`) — Coinbase-style recurring buys, cross-chain and gasless. Pre-sign N buys; they auto-fund your trading wallet on whichever L2 you choose.
4. **Last Will** (`/demo/heir`) — dead man's switch. Pre-signed payouts to your heir, gated by a heartbeat. Keep clicking "I'm still here" → keeper skips. Stop clicking → switch trips → heir gets paid. No custodian, no on-chain death oracle.

A neutral dashboard at `/app` lists balances, active subscriptions, and per-intent status with explorer links.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Frontend — Next.js 16 + Privy + viem + Tailwind     │
│  - Privy: email login OR external wallet             │
│  - Build & batch-sign N BatchCompact EIP-712 intents │
│  - 4 demos + neutral dashboard                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼ POST /api/subscriptions
┌──────────────────────────────────────────────────────┐
│  Storage — Upstash Redis (Vercel KV REST)            │
│  - Subscriptions { id, sponsor, schedule, ... }      │
│  - Signed intents { sig, fire_at, status }           │
│  - Heartbeats for dead-man-switch subs               │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼ every 1 min via vercel.json
┌──────────────────────────────────────────────────────┐
│  Keeper — /api/keeper/tick                            │
│  - Reads due signed intents                          │
│  - For deadmans subs: checks heartbeat, skips if alive│
│  - POSTs each remaining intent to order(-dev).li.fi  │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
   LI.FI solver network fills on dest chain
                 │
                 ▼
   Recipient receives USDC · Compact lock debited
```

### Key components

| File                                         | What it does                                                       |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `src/lib/lifi/constants.ts`                  | Chain map, contract addresses, USDC token table, oracle addresses. |
| `src/lib/lifi/compact.ts`                    | Builds `StandardOrder` + `BatchCompact`, EIP-712 typed data.       |
| `src/lib/lifi/compactTypes.ts`               | The Compact's EIP-712 type schemas (`BatchCompact`, `Mandate`, …). |
| `src/lib/lifi/actions.ts`                    | `compactDeposit`, `ensureErc20Approval`, finalize helpers.         |
| `src/lib/lifi/orderServer.ts`                | `requestQuote`, `submitOrder`, `getOrderStatus`.                   |
| `src/lib/lifi/idLib.ts`                      | Resource-lock ID computation (`toId`).                             |
| `src/lib/recur/useRecur.ts`                  | React hook: deposit + batch-sign + save flow.                      |
| `src/lib/privy/PrivyProviders.tsx`           | Privy config (email + wallet, embedded wallets).                   |
| `src/lib/storage.ts`                         | Vercel KV / Upstash with /tmp file fallback.                       |
| `src/app/demo/streamflix/page.tsx`           | Streamflix landing + checkout.                                     |
| `src/app/demo/payroll/page.tsx`              | Payroll multi-employee flow.                                       |
| `src/app/demo/dca/page.tsx`                  | Recur Stack — cross-chain DCA.                                     |
| `src/app/demo/heir/page.tsx`                 | Last Will — heartbeat-gated payouts.                               |
| `src/app/app/page.tsx`                       | Neutral dashboard with balance, subs, per-intent status.           |
| `src/app/api/keeper/tick/route.ts`           | Vercel Cron entrypoint — submits due intents to LI.FI.             |
| `src/app/api/subscriptions/route.ts`         | POST to save sub + N intents; GET to list by sponsor.              |
| `src/app/api/heartbeat/route.ts`             | Heartbeat endpoint for Last Will subs.                             |
| `vercel.json`                                | Cron: `* * * * *` → `/api/keeper/tick`.                            |

---

## LI.FI Intent flow (what actually happens on-chain)

1. **One-time setup** (per token/chain):
   - User approves USDC → The Compact (`0x0000…9788`).
   - User calls `depositERC20(token, lockTag, amount, recipient)` on The Compact.
   - The `lockTag` is derived from the resource lock ID via `toId(true, OneDay, ALWAYS_OK_ALLOCATOR, USDC)`.
2. **Subscription creation** (per sub):
   - For each of N periods, build a `StandardOrder` with a unique nonce, future `fillDeadline`, and Polymer oracle.
   - Wrap each as a `BatchCompact` and sign via EIP-712 (`signTypedData`).
   - POST `{ subscription, intents }` to `/api/subscriptions`.
3. **Keeper tick** (every minute):
   - Read due intents from KV.
   - For `type: "deadmans"` subs, check heartbeat freshness — skip if alive, fire if stale.
   - POST each remaining due intent to `https://order.li.fi/orders/submit` (or `order-dev.li.fi` on testnet) with `orderType: "CatalystCompactOrder"`, the order, settler, and `sponsorSignature`.
   - LI.FI's solver network matches each intent to a standing quote.
   - Solver fills output on destination chain → oracle proves → finalize on input chain.

---

## Why Compact specifically

Recurring crypto payments have been broken for years:

| Pattern               | Problem                                                          |
| --------------------- | ---------------------------------------------------------------- |
| Streaming (Sablier)   | Locks capital per stream, single-chain, requires constant claim. |
| Smart-account autopay | Single-chain, AA wallet-specific, brittle UX.                    |
| Manual transfers      | Gas every period, no automation, unusable cross-chain.           |

Compact decouples the **deposit** from each **payment**: deposit once, issue unlimited signed intents against the lock. Combined with LI.FI's solver marketplace, you get gasless recurring payments to any chain.

And once the keeper sits between the user and the order server, you can layer arbitrary off-chain conditions on top — that's what Last Will demonstrates. The substrate isn't "subscriptions"; it's gasless cross-chain payments at arbitrary cadence with arbitrary conditions.

---

## Getting started locally

```bash
# 1) Get a Privy App ID
#    Go to https://dashboard.privy.io, create an app, copy the App ID

# 2) Configure env
cp .env.example .env.local
#    Edit .env.local and set NEXT_PUBLIC_PRIVY_APP_ID

# 3) Install + run
pnpm install
pnpm dev
#    Open http://localhost:3000
```

### Testnet wallets you'll need

- **Base Sepolia ETH** — for gas on the one-time deposit
- **Base Sepolia USDC** (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`) — for the actual subscription balance
- **Arbitrum Sepolia / Optimism Sepolia ETH** — only needed if you want to manually claim recipient funds

Faucets: [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet), [Alchemy Faucet](https://www.alchemy.com/faucets), [QuickNode Faucet](https://faucet.quicknode.com).

### Deploying to Vercel

```bash
vercel deploy
# Set env vars in the dashboard:
# - NEXT_PUBLIC_PRIVY_APP_ID
# - KV_URL / KV_REST_API_URL / KV_REST_API_TOKEN (Upstash Redis via Vercel Storage tab)
# - CRON_SECRET (random long string for /api/keeper/tick auth)
```

The included `vercel.json` schedules `/api/keeper/tick` every minute.

---

## What this submission is and is not

**This submission is**:

- A working open-source dApp demonstrating the LI.FI Intents Compact flow with consumer-grade UX across four distinct use cases.
- A reproducible reference for any builder wanting to ship recurring or conditional cross-chain payments on Intents.
- A ~4-minute video walking through all four demos end-to-end on testnet.

**This submission is not**:

- A production payroll / streaming / inheritance service.
- A custom solver implementation (we use LI.FI's solver network as-is).
- A claim to the Netflix brand. Streamflix is a Netflix-style demo theme for storytelling only — clearly labeled as "Mock UI for demo. Not affiliated with Netflix."

---

## Tech credits

- [LI.FI Intents](https://docs.li.fi/lifi-intents/introduction) — the protocol this submission showcases
- [Open Intents Framework](https://openintents.xyz/) — EF-led open standard powering LI.FI Intents
- [The Compact (Uniswap)](https://github.com/Uniswap/the-compact) — resource-lock contract by Uniswap Labs
- [lintent](https://github.com/lifinance/lintent) — LI.FI's own Compact reference implementation we studied
- [Privy](https://privy.io) — email + wallet auth with embedded wallets
- [viem](https://viem.sh) — typed Ethereum client

---

## License

MIT. Fork it. Ship it. Improve it.
