export const BatchCompactType = [
  { name: "arbiter", type: "address" },
  { name: "sponsor", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "expires", type: "uint256" },
  { name: "commitments", type: "Lock[]" },
  { name: "mandate", type: "Mandate" },
] as const;

export const LockType = [
  { name: "lockTag", type: "bytes12" },
  { name: "token", type: "address" },
  { name: "amount", type: "uint256" },
] as const;

export const MandateType = [
  { name: "fillDeadline", type: "uint32" },
  { name: "inputOracle", type: "address" },
  { name: "outputs", type: "MandateOutput[]" },
] as const;

export const MandateOutputType = [
  { name: "oracle", type: "bytes32" },
  { name: "settler", type: "bytes32" },
  { name: "chainId", type: "uint256" },
  { name: "token", type: "bytes32" },
  { name: "amount", type: "uint256" },
  { name: "recipient", type: "bytes32" },
  { name: "callbackData", type: "bytes" },
  { name: "context", type: "bytes" },
] as const;

export const compactTypes = {
  BatchCompact: BatchCompactType,
  Lock: LockType,
  Mandate: MandateType,
  MandateOutput: MandateOutputType,
} as const;

export const COMPACT_TYPE_HASH =
  "0x5f094e58b077a941d99d3449bd1be66fd3bc9d23ab9e4c06a8713cabc3e3b634" as const;
