import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimismSepolia,
  sepolia,
  type Chain,
} from "viem/chains";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as const;
export const BYTES32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export const COMPACT = "0x00000000000000171ede64904551eeDF3C6C9788" as const;
export const INPUT_SETTLER_COMPACT_LIFI =
  "0x0000000000cd5f7fDEc90a03a31F79E5Fbc6A9Cf" as const;
export const INPUT_SETTLER_ESCROW_LIFI =
  "0x000025c3226C00B2Cdc200005a1600509f4e00C0" as const;
export const COIN_FILLER = "0x0000000000eC36B683C2E6AC89e9A75989C22a2e" as const;

export const ALWAYS_OK_ALLOCATOR = "281773970620737143753120258" as const;
export const POLYMER_ALLOCATOR = "116450367070547927622991121" as const;

export const POLYMER_ORACLE = {
  ethereum: "0x0000003E06000007A224AeE90052fA6bb46d43C9",
  base: "0x0000003E06000007A224AeE90052fA6bb46d43C9",
  arbitrum: "0x0000003E06000007A224AeE90052fA6bb46d43C9",
  sepolia: "0xC401b53377b8A71A7cEB820e6a4dC53832343a90",
  baseSepolia: "0xC401b53377b8A71A7cEB820e6a4dC53832343a90",
  arbitrumSepolia: "0xC401b53377b8A71A7cEB820e6a4dC53832343a90",
  optimismSepolia: "0xC401b53377b8A71A7cEB820e6a4dC53832343a90",
} as const;

export const ORDER_SERVER = {
  mainnet: "https://order.li.fi",
  testnet: "https://order-dev.li.fi",
} as const;

export type SupportedChainKey =
  | "base"
  | "arbitrum"
  | "baseSepolia"
  | "arbitrumSepolia"
  | "sepolia"
  | "optimismSepolia";

export const SUPPORTED_CHAINS: Record<SupportedChainKey, Chain> = {
  base,
  arbitrum,
  baseSepolia,
  arbitrumSepolia,
  sepolia,
  optimismSepolia,
};

export const CHAIN_NAME_BY_ID: Record<number, SupportedChainKey> = {
  [base.id]: "base",
  [arbitrum.id]: "arbitrum",
  [baseSepolia.id]: "baseSepolia",
  [arbitrumSepolia.id]: "arbitrumSepolia",
  [sepolia.id]: "sepolia",
  [optimismSepolia.id]: "optimismSepolia",
};

export const TESTNET_CHAIN_IDS = new Set<number>([
  baseSepolia.id,
  arbitrumSepolia.id,
  sepolia.id,
  optimismSepolia.id,
]);

export type TokenInfo = {
  symbol: string;
  address: `0x${string}`;
  chain: SupportedChainKey;
  chainId: number;
  decimals: number;
};

export const TOKENS: Record<string, TokenInfo> = {
  "usdc:base": {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chain: "base",
    chainId: base.id,
    decimals: 6,
  },
  "usdc:arbitrum": {
    symbol: "USDC",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    chain: "arbitrum",
    chainId: arbitrum.id,
    decimals: 6,
  },
  "usdc:baseSepolia": {
    symbol: "USDC",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    chain: "baseSepolia",
    chainId: baseSepolia.id,
    decimals: 6,
  },
  "usdc:arbitrumSepolia": {
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    chain: "arbitrumSepolia",
    chainId: arbitrumSepolia.id,
    decimals: 6,
  },
  "usdc:sepolia": {
    symbol: "USDC",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    chain: "sepolia",
    chainId: sepolia.id,
    decimals: 6,
  },
  "usdc:optimismSepolia": {
    symbol: "USDC",
    address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    chain: "optimismSepolia",
    chainId: optimismSepolia.id,
    decimals: 6,
  },
};

export const EXPLORER_TX = {
  [base.id]: "https://basescan.org/tx/",
  [arbitrum.id]: "https://arbiscan.io/tx/",
  [baseSepolia.id]: "https://sepolia.basescan.org/tx/",
  [arbitrumSepolia.id]: "https://sepolia.arbiscan.io/tx/",
  [sepolia.id]: "https://sepolia.etherscan.io/tx/",
  [optimismSepolia.id]: "https://sepolia-optimism.etherscan.io/tx/",
} as const;

export function getOrderServerUrl(_chainId: number): string {
  return ORDER_SERVER.mainnet;
}

export function getPolymerOracle(chainKey: SupportedChainKey): `0x${string}` {
  return POLYMER_ORACLE[chainKey] as `0x${string}`;
}

export function getChainKey(chainId: number): SupportedChainKey {
  const key = CHAIN_NAME_BY_ID[chainId];
  if (!key) throw new Error(`Unsupported chain: ${chainId}`);
  return key;
}

export function getChain(chainId: number): Chain {
  return SUPPORTED_CHAINS[getChainKey(chainId)];
}
