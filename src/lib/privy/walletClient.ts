"use client";

import { createWalletClient, custom, type WalletClient, type EIP1193Provider } from "viem";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { getChain } from "../lifi/constants";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isUnknownConnectorError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /Unknown connector error/i.test(msg);
}

async function readCurrentChainId(provider: EIP1193Provider): Promise<number | null> {
  try {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

async function ensureChainAdded(
  wallet: ConnectedWallet,
  chainId: number,
): Promise<EIP1193Provider> {
  // Wait briefly for the wallet to be ready (esp. embedded wallets right after login).
  let provider: EIP1193Provider | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      provider = (await wallet.getEthereumProvider()) as EIP1193Provider;
      break;
    } catch (e) {
      lastErr = e;
      await sleep(150);
    }
  }
  if (!provider) {
    throw new Error(
      "Wallet isn't ready yet. Wait a second after signing in, then try again.",
      { cause: lastErr instanceof Error ? lastErr : undefined },
    );
  }

  const current = await readCurrentChainId(provider);
  if (current === chainId) return provider;

  // Try switchChain with a small retry — embedded wallets occasionally throw
  // "Unknown connector error" on the very first call.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await wallet.switchChain(chainId);
      return provider;
    } catch (err: unknown) {
      console.error("[walletClient] wallet.switchChain failed", {
        attempt,
        chainId,
        currentChain: await readCurrentChainId(provider),
        walletConnectorType: (wallet as any).connectorType,
        walletClientType: (wallet as any).walletClientType,
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorCode: (err as any)?.code,
        errorCause: (err as any)?.cause,
      });
      const code = typeof err === "object" && err !== null ? (err as any).code : undefined;
      const msg = err instanceof Error ? err.message : String(err);
      const causeMsg =
        err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
      const isChainMissing =
        code === 4902 ||
        /unknown network|unrecognized chain|eip155:/i.test(msg + " " + causeMsg);

      if (isChainMissing) {
        const chain = getChain(chainId);
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: chain.rpcUrls.default.http,
                blockExplorerUrls: chain.blockExplorers
                  ? [chain.blockExplorers.default.url]
                  : undefined,
              },
            ],
          });
          await wallet.switchChain(chainId);
          return provider;
        } catch (addErr) {
          try {
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
            return provider;
          } catch (switchErr) {
            const walletName =
              (wallet as any).walletClientType || (wallet as any).connectorType || "your wallet";
            const friendly = new Error(
              `${walletName} doesn't know about ${chain.name} (chainId ${chainId}). ` +
                `Open ${walletName}, enable testnets if needed, and add "${chain.name}" manually — ` +
                `RPC: ${chain.rpcUrls.default.http[0]} — then click Run payroll again.`,
            );
            (friendly as any).cause = switchErr ?? addErr;
            throw friendly;
          }
        }
      }

      if (isUnknownConnectorError(err) && attempt < 2) {
        await sleep(200 * (attempt + 1));
        // Re-check — switchChain may have actually succeeded under the hood.
        const now = await readCurrentChainId(provider);
        if (now === chainId) return provider;
        continue;
      }

      if (isUnknownConnectorError(err)) {
        throw new Error(
          `Couldn't switch wallet to ${getChain(chainId).name}. ` +
            `Open your wallet, switch the network manually, then try again.`,
        );
      }
      throw err;
    }
  }
  return provider;
}

// Wrap the EIP-1193 provider so Privy's catch-all "Unknown connector error"
// gets a useful prefix (the RPC method that actually failed). The underlying
// error still propagates — viem and our callers can still inspect it.
function wrapProvider(provider: EIP1193Provider, chainId: number): EIP1193Provider {
  const wrapped: EIP1193Provider = Object.assign(
    Object.create(Object.getPrototypeOf(provider) as object) as EIP1193Provider,
    provider,
    {
      request: (async (args: any) => {
        try {
          return await provider.request(args);
        } catch (err) {
          console.error("[privy provider] request failed:", {
            method: args?.method,
            params: args?.params,
            chainId,
            error: err,
            errorMessage: err instanceof Error ? err.message : String(err),
            errorCode: (err as any)?.code,
            errorCause: (err as any)?.cause,
            errorStack: err instanceof Error ? err.stack : undefined,
          });
          if (isUnknownConnectorError(err)) {
            const friendly = new Error(
              `Wallet rejected or timed out on ${args.method} (chain ${getChain(chainId).name}). ` +
                `Open your wallet, confirm you're on the right network, and try again.`,
            );
            (friendly as any).cause = err;
            throw friendly;
          }
          throw err;
        }
      }) as EIP1193Provider["request"],
    },
  );
  return wrapped;
}

export async function getViemWalletClient(
  wallet: ConnectedWallet,
  chainId: number,
): Promise<WalletClient> {
  const provider = await ensureChainAdded(wallet, chainId);
  return createWalletClient({
    account: wallet.address as `0x${string}`,
    chain: getChain(chainId),
    transport: custom(wrapProvider(provider, chainId)),
  });
}
