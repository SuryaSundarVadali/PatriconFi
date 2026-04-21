import { AgentTable } from "../../components/AgentTable";

export default function AgentsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Registered Agents</h2>
      <AgentTable
        agents={[
          { id: "agent-1", identity: "did:patriconfi:1", status: "active" },
          { id: "agent-2", identity: "did:patriconfi:2", status: "active" },
        ]}
      />
    </main>
  );
}
