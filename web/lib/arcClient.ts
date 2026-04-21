import {
  ACTIVITY_LEDGER_ABI,
  AGENT_REGISTRY_ABI,
  AGENT_VAULT_ABI,
  ARC_USDC_DECIMALS,
  type Address,
  CONTRACTS,
} from "./contracts";

type ArcPublicClient = {
  getLogs: (params: Record<string, unknown>) => Promise<Array<Record<string, any>>>;
  readContract: (params: Record<string, unknown>) => Promise<unknown>;
};

export type RegisteredAgent = {
  agentId: bigint;
  owner: Address;
  metadataUri: string;
};

export type InteractionEvent = {
  interactionId: bigint;
  agentFrom: bigint;
  agentTo: bigint;
  priceMicrousdc: bigint;
  timestamp: bigint;
  txHash: `0x${string}`;
};

export function isUnsetAddress(address: Address): boolean {
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000";
}

export function formatUsdc(value: bigint): string {
  const scale = BigInt(10 ** ARC_USDC_DECIMALS);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(ARC_USDC_DECIMALS, "0").replace(/0+$/, "");
  const rendered = fraction ? `${whole.toString()}.${fraction}` : whole.toString();
  return Number(rendered).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export function explorerTxUrl(txHash: string): string {
  const base = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://sepolia.etherscan.io";
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  const base = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://sepolia.etherscan.io";
  return `${base.replace(/\/$/, "")}/address/${address}`;
}

export async function fetchRegisteredAgents(publicClient: ArcPublicClient): Promise<RegisteredAgent[]> {
  if (isUnsetAddress(CONTRACTS.agentRegistry)) {
    return [];
  }

  const logs = await publicClient.getLogs({
    address: CONTRACTS.agentRegistry,
    event: AGENT_REGISTRY_ABI[1],
    fromBlock: "earliest",
    toBlock: "latest",
  });

  const dedup = new Map<string, RegisteredAgent>();
  for (const log of logs) {
    const args = log.args;
    if (!args?.agent_id || !args.owner || typeof args.metadata_uri !== "string") {
      continue;
    }
    dedup.set(args.agent_id.toString(), {
      agentId: args.agent_id,
      owner: args.owner,
      metadataUri: args.metadata_uri,
    });
  }

  return [...dedup.values()].sort((a, b) => Number(a.agentId - b.agentId));
}

export async function fetchVaultBalanceByAgent(
  publicClient: ArcPublicClient,
  agentId: bigint,
): Promise<bigint> {
  if (isUnsetAddress(CONTRACTS.agentVault)) {
    return 0n;
  }

  return (await publicClient.readContract({
    address: CONTRACTS.agentVault,
    abi: AGENT_VAULT_ABI,
    functionName: "balance_of",
    args: [agentId],
  })) as bigint;
}

export async function fetchInteractionFeed(publicClient: ArcPublicClient): Promise<InteractionEvent[]> {
  if (isUnsetAddress(CONTRACTS.activityLedger)) {
    return [];
  }

  const logs = await publicClient.getLogs({
    address: CONTRACTS.activityLedger,
    event: ACTIVITY_LEDGER_ABI[1],
    fromBlock: "earliest",
    toBlock: "latest",
  });

  const items: InteractionEvent[] = [];
  for (const log of logs) {
    const args = log.args;
    if (
      !args?.interaction_id ||
      !args.agent_from ||
      !args.agent_to ||
      !args.price_usdc ||
      !args.timestamp ||
      !log.transactionHash
    ) {
      continue;
    }

    items.push({
      interactionId: args.interaction_id,
      agentFrom: args.agent_from,
      agentTo: args.agent_to,
      priceMicrousdc: args.price_usdc,
      timestamp: args.timestamp,
      txHash: log.transactionHash,
    });
  }

  return items.sort((a, b) => Number(b.timestamp - a.timestamp));
}
