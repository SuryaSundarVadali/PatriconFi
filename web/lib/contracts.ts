export type Address = `0x${string}`;

const zeroAddress = "0x0000000000000000000000000000000000000000" as Address;

export const CONTRACTS = {
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ?? zeroAddress) as Address,
  agentVault: (process.env.NEXT_PUBLIC_AGENT_VAULT_ADDRESS ?? zeroAddress) as Address,
  activityLedger: (process.env.NEXT_PUBLIC_ACTIVITY_LEDGER_ADDRESS ?? zeroAddress) as Address,
  // Set this from Arc docs or your deployment env.
  usdc: (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ?? zeroAddress) as Address,
} as const;

export const ARC_USDC_DECIMALS = 6;

export const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export const AGENT_REGISTRY_ABI = [
  {
    type: "function",
    name: "register_agent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agent_id", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "metadata_uri", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { indexed: true, name: "agent_id", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "metadata_uri", type: "string" },
    ],
    anonymous: false,
  },
] as const;

export const AGENT_VAULT_ABI = [
  {
    type: "function",
    name: "balance_of",
    stateMutability: "view",
    inputs: [{ name: "agent_id", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const ACTIVITY_LEDGER_ABI = [
  {
    type: "function",
    name: "interaction_count",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "InteractionRecorded",
    inputs: [
      { indexed: true, name: "interaction_id", type: "uint256" },
      { indexed: true, name: "agent_from", type: "uint256" },
      { indexed: true, name: "agent_to", type: "uint256" },
      { indexed: false, name: "price_usdc", type: "uint256" },
      { indexed: false, name: "resource_id", type: "bytes32" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    anonymous: false,
  },
] as const;
