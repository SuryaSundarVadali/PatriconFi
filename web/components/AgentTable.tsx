type AgentRow = {
  id: string;
  owner: string;
  metadataUri: string;
  status: string;
};

export function AgentTable({ agents }: { agents: AgentRow[] }) {
  return (
    <table cellPadding={8}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Owner</th>
          <th>Metadata</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr key={agent.id}>
            <td>{agent.id}</td>
            <td>{agent.owner}</td>
            <td>{agent.metadataUri}</td>
            <td>{agent.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
