export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export const COMPACT_ABI = [
  {
    type: "function",
    name: "depositERC20",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "lockTag", type: "bytes12" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositNative",
    stateMutability: "payable",
    inputs: [
      { name: "lockTag", type: "bytes12" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "enableForcedWithdrawal",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "withdrawableAt", type: "uint256" }],
  },
  {
    type: "function",
    name: "disableForcedWithdrawal",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "forcedWithdrawal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getForcedWithdrawalStatus",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [
      { name: "status", type: "uint8" },
      { name: "forcedWithdrawalAvailableAt", type: "uint256" },
    ],
  },
] as const;

const STANDARD_ORDER_COMPONENTS = [
  { name: "user", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "originChainId", type: "uint256" },
  { name: "expires", type: "uint32" },
  { name: "fillDeadline", type: "uint32" },
  { name: "inputOracle", type: "address" },
  { name: "inputs", type: "uint256[2][]" },
  {
    name: "outputs",
    type: "tuple[]",
    components: [
      { name: "oracle", type: "bytes32" },
      { name: "settler", type: "bytes32" },
      { name: "chainId", type: "uint256" },
      { name: "token", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "bytes32" },
      { name: "callbackData", type: "bytes" },
      { name: "context", type: "bytes" },
    ],
  },
] as const;

export const SETTLER_COMPACT_ABI = [
  {
    type: "function",
    name: "finalise",
    stateMutability: "nonpayable",
    inputs: [
      { name: "order", type: "tuple", components: STANDARD_ORDER_COMPONENTS },
      { name: "signatures", type: "bytes" },
      {
        name: "solveParams",
        type: "tuple[]",
        components: [
          { name: "timestamp", type: "uint32" },
          { name: "solver", type: "bytes32" },
        ],
      },
      { name: "destination", type: "bytes32" },
      { name: "call", type: "bytes" },
    ],
    outputs: [],
  },
] as const;
