"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AgentTable } from "../../components/AgentTable";
import { WalletConnector } from "../../components/WalletConnector";
import { fetchRegisteredAgents, isUnsetAddress } from "../../lib/arcClient";
import { AGENT_REGISTRY_ABI, CONTRACTS } from "../../lib/contracts";

type AgentFormState = {
  agentId: string;
  metadataUri: string;
};

const e2eMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";

export default function AgentsPage() {
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();

  const [agents, setAgents] = useState<
    Array<{ id: string; owner: string; metadataUri: string; status: string }>
  >([]);
  const [form, setForm] = useState<AgentFormState>({ agentId: "", metadataUri: "" });
  const [feedback, setFeedback] = useState<string>("");

  const { writeContractAsync, data: txHash, isPending: isSigning, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });

  const canRegister = useMemo(() => {
    return (isConnected && address) || e2eMode;
  }, [address, isConnected]);

  const loadAgents = async () => {
    if (!publicClient) {
      return;
    }

    const rows = await fetchRegisteredAgents(publicClient);
    setAgents(
      rows.map((agent) => ({
        id: agent.agentId.toString(),
        owner: agent.owner,
        metadataUri: agent.metadataUri,
        status: "registered",
      })),
    );
  };

  useEffect(() => {
    void loadAgents();
    const handle = setInterval(() => void loadAgents(), 10_000);
    return () => clearInterval(handle);
  }, [publicClient]);

  useEffect(() => {
    if (receipt.isSuccess) {
      setFeedback(`Registration confirmed: ${receipt.data.transactionHash}`);
      void loadAgents();
    }
  }, [receipt.isSuccess]);

  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    if (!form.agentId || !form.metadataUri) {
      setFeedback("Agent ID and metadata URI are required.");
      return;
    }
    if (!canRegister) {
      setFeedback("Connect your wallet before submitting a transaction.");
      return;
    }

    const parsedAgentId = BigInt(form.agentId);

    if (e2eMode && !isConnected) {
      setAgents((current) => [
        ...current,
        {
          id: parsedAgentId.toString(),
          owner: "0xE2E0000000000000000000000000000000000001",
          metadataUri: form.metadataUri,
          status: "registered",
        },
      ]);
      setFeedback("Test-mode registration simulated.");
      return;
    }

    if (isUnsetAddress(CONTRACTS.agentRegistry)) {
      setFeedback("Set NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS before registering.");
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "register_agent",
        args: [parsedAgentId, address!, form.metadataUri],
      });
      setFeedback(`Transaction submitted for wallet confirmation: ${hash}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to submit transaction.");
    }
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 20 }}>
      <h2 style={{ margin: 0 }}>Registered Agents</h2>
      <WalletConnector />

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Register New Agent</h3>
        <p style={{ marginTop: 0 }}>
          Registering creates a wallet transaction. Review contract and gas details in your wallet before confirming.
        </p>
        <form onSubmit={(event) => void onRegister(event)} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label>
            Agent ID
            <input
              data-testid="agent-id-input"
              type="number"
              min={1}
              value={form.agentId}
              onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value }))}
            />
          </label>
          <label>
            Metadata URI
            <input
              data-testid="metadata-uri-input"
              type="url"
              placeholder="ipfs://..."
              value={form.metadataUri}
              onChange={(event) => setForm((current) => ({ ...current, metadataUri: event.target.value }))}
            />
          </label>
          <button data-testid="register-agent-btn" type="submit" disabled={isSigning || receipt.isLoading}>
            {isSigning ? "Awaiting Wallet Signature" : receipt.isLoading ? "Waiting For Confirmation" : "Register Agent"}
          </button>
        </form>
        {feedback && <p data-testid="register-feedback">{feedback}</p>}
        {writeError && <p style={{ color: "#b42318" }}>{writeError.message}</p>}
      </section>

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>On-chain Registry Snapshot</h3>
        <AgentTable agents={agents} />
      </section>
    </main>
  );
}
