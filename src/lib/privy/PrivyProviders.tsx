"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  arbitrumSepolia,
  baseSepolia,
  optimismSepolia,
  sepolia,
} from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function PrivyProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  if (!PRIVY_APP_ID) {
    return (
      <div className="m-8 rounded-2xl border border-[color:var(--err)] bg-[color:#F0CFC9] p-6 text-[color:#5a2519]">
        <h2 className="mb-2 text-lg font-semibold">Missing Privy App ID</h2>
        <p className="text-sm">
          Add <code className="rounded bg-[var(--surface-2)] px-1">NEXT_PUBLIC_PRIVY_APP_ID</code> to
          <code className="ml-1 rounded bg-[var(--surface-2)] px-1">.env.local</code>. Get one at{" "}
          <a
            href="https://dashboard.privy.io"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            dashboard.privy.io
          </a>
          .
        </p>
        <div className="mt-4 text-xs text-red-300/80">
          Children render below for SSR; auth flows will not work until configured.
        </div>
        <div className="mt-4 border-t border-red-500/30 pt-4">{children}</div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#5A3F50",
          showWalletLoginFirst: false,
          logo: undefined,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, arbitrumSepolia, optimismSepolia, sepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
