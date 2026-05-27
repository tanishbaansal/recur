import { createPublicClient, http, type PublicClient, type Chain } from "viem";
import { SUPPORTED_CHAINS, type SupportedChainKey } from "./lifi/constants";

const RPCS: Record<SupportedChainKey, string | undefined> = {
  base: process.env.NEXT_PUBLIC_RPC_BASE,
  arbitrum: process.env.NEXT_PUBLIC_RPC_ARBITRUM,
  baseSepolia: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA,
  arbitrumSepolia: process.env.NEXT_PUBLIC_RPC_ARB_SEPOLIA,
  sepolia: process.env.NEXT_PUBLIC_RPC_SEPOLIA,
  optimismSepolia: process.env.NEXT_PUBLIC_RPC_OP_SEPOLIA,
};

const clientCache = new Map<number, PublicClient>();

export function getPublicClient(chainOrId: number | Chain): PublicClient {
  const chainId = typeof chainOrId === "number" ? chainOrId : chainOrId.id;
  const cached = clientCache.get(chainId);
  if (cached) return cached;

  const entry = Object.entries(SUPPORTED_CHAINS).find(([, chain]) => chain.id === chainId);
  if (!entry) throw new Error(`Unsupported chain ${chainId}`);
  const [key, chain] = entry as [SupportedChainKey, Chain];

  const rpcUrl = RPCS[key];
  const client = createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  }) as PublicClient;
  clientCache.set(chainId, client);
  return client;
}
