"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { TxFeed } from "../../components/TxFeed";
import { WalletConnector } from "../../components/WalletConnector";
import {
  explorerAddressUrl,
  explorerTxUrl,
  fetchInteractionFeed,
  fetchRegisteredAgents,
  fetchVaultBalanceByAgent,
  formatUsdc,
  isUnsetAddress,
} from "../../lib/arcClient";
import { CONTRACTS } from "../../lib/contracts";

type DemoResult = {
  interactions?: number;
  total_spent_microusdc?: number;
  avg_price_microusdc?: number;
  txHashes?: string[];
};

const DEMO_COUNT = 55;
const DEMO_PRICE_MICROUSDC = 2500;

export default function DashboardPage() {
  const publicClient = usePublicClient();
  const [agentBalances, setAgentBalances] = useState<Array<{ agentId: string; balance: bigint }>>([]);
  const [events, setEvents] = useState<
    Array<{
      txHash: string;
      interactionId: string;
      agentFrom: string;
      agentTo: string;
      priceMicrousdc: string;
      timestamp: string;
      explorerUrl: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runFeedback, setRunFeedback] = useState("");
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);

  const refreshDashboard = useCallback(async () => {
    if (!publicClient) {
      return;
    }

    setLoading(true);
    try {
      const [agents, interactions] = await Promise.all([
        fetchRegisteredAgents(publicClient),
        fetchInteractionFeed(publicClient),
      ]);

      const balances = await Promise.all(
        agents.map(async (agent) => ({
          agentId: agent.agentId.toString(),
          balance: await fetchVaultBalanceByAgent(publicClient, agent.agentId),
        })),
      );

      setAgentBalances(balances);
      setEvents(
        interactions.map((event) => ({
          txHash: event.txHash,
          interactionId: event.interactionId.toString(),
          agentFrom: event.agentFrom.toString(),
          agentTo: event.agentTo.toString(),
          priceMicrousdc: event.priceMicrousdc.toString(),
          timestamp: new Date(Number(event.timestamp) * 1000).toLocaleString(),
          explorerUrl: explorerTxUrl(event.txHash),
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    void refreshDashboard();
    const interval = setInterval(() => void refreshDashboard(), 12_000);
    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const summaryMetrics = useMemo(() => {
    const eventInteractions = events.length;
    const eventTotalMicrousdc = events.reduce((sum, event) => sum + BigInt(event.priceMicrousdc), 0n);
    const fallbackInteractions = demoResult?.interactions ?? 0;
    const fallbackTotalMicrousdc = BigInt(demoResult?.total_spent_microusdc ?? 0);
    const fallbackAvgMicrousdc = BigInt(demoResult?.avg_price_microusdc ?? 0);

    const totalInteractions = Math.max(eventInteractions, fallbackInteractions);
    const totalMicrousdc = eventTotalMicrousdc > 0n ? eventTotalMicrousdc : fallbackTotalMicrousdc;
    const avgMicrousdc =
      eventInteractions > 0
        ? eventTotalMicrousdc / BigInt(eventInteractions)
        : fallbackAvgMicrousdc > 0n
          ? fallbackAvgMicrousdc
          : 0n;

    return {
      totalInteractions,
      totalMicrousdc,
      avgMicrousdc,
    };
  }, [demoResult, events]);

  const runDemo = async () => {
    setIsRunningDemo(true);
    setRunFeedback("Starting demo orchestration...");
    setDemoResult({
      interactions: DEMO_COUNT,
      total_spent_microusdc: DEMO_COUNT * DEMO_PRICE_MICROUSDC,
      avg_price_microusdc: DEMO_PRICE_MICROUSDC,
    });
    setRunProgress(8);

    const progressTimer = setInterval(() => {
      setRunProgress((current) => Math.min(current + 9, 92));
    }, 500);

    try {
      const response = await fetch("/api/demo-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: DEMO_COUNT, price_microusdc: DEMO_PRICE_MICROUSDC }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Demo run failed");
      }

      const payload = (await response.json()) as DemoResult;
      setDemoResult(payload);
      setRunFeedback("Demo run completed. Refreshing on-chain feed...");
      setRunProgress(100);
      await refreshDashboard();
    } catch (error) {
      setRunFeedback(error instanceof Error ? error.message : "Unable to run demo.");
    } finally {
      clearInterval(progressTimer);
      setIsRunningDemo(false);
    }
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 20 }}>
      <h2 style={{ margin: 0 }}>Arc Payment Dashboard</h2>
      <WalletConnector />

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Summary Metrics</h3>
        <p data-testid="total-interactions">Total interactions: {summaryMetrics.totalInteractions}</p>
        <p>Total USDC volume: {formatUsdc(summaryMetrics.totalMicrousdc)} USDC</p>
        <p data-testid="avg-price-per-interaction">
          Average price per interaction: {formatUsdc(summaryMetrics.avgMicrousdc)} USDC
        </p>
      </section>

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Per-agent Vault Balances</h3>
        {loading && <p>Refreshing balances...</p>}
        {agentBalances.length === 0 && <p>No registered agents found yet.</p>}
        <ul>
          {agentBalances.map((item) => (
            <li key={item.agentId}>
              Agent {item.agentId}: {formatUsdc(item.balance)} USDC
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Demo Runner</h3>
        <p style={{ marginTop: 0 }}>Runs the backend orchestrator and records interactions to ActivityLedger.</p>
        <button data-testid="run-demo-btn" type="button" disabled={isRunningDemo} onClick={() => void runDemo()}>
          {isRunningDemo ? "Running Demo..." : "Run Demo (55 interactions @ 0.0025 USDC)"}
        </button>
        <div style={{ marginTop: 10 }}>
          <progress value={runProgress} max={100} style={{ width: "100%" }} />
        </div>
        {runFeedback && <p data-testid="demo-feedback">{runFeedback}</p>}
        {demoResult && (
          <div data-testid="demo-result">
            <p>Interactions: {demoResult.interactions ?? 0}</p>
            <p>
              Total spent: {formatUsdc(BigInt(demoResult.total_spent_microusdc ?? 0))} USDC | Average per call:{" "}
              {formatUsdc(BigInt(demoResult.avg_price_microusdc ?? 0))} USDC
            </p>
          </div>
        )}
        <p>
          Verify on explorer:{" "}
          {!isUnsetAddress(CONTRACTS.activityLedger) && (
            <a href={explorerAddressUrl(CONTRACTS.activityLedger)} target="_blank" rel="noreferrer">
              ActivityLedger
            </a>
          )}
          {!isUnsetAddress(CONTRACTS.agentRegistry) && (
            <>
              {" "}|{" "}
              <a href={explorerAddressUrl(CONTRACTS.agentRegistry)} target="_blank" rel="noreferrer">
                AgentRegistry
              </a>
            </>
          )}
        </p>
      </section>

      <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16 }}>
        <TxFeed items={events} />
      </section>
    </main>
  );
}
