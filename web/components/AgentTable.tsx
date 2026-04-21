type AgentRow = {
  id: string;
  identity: string;
  status: string;
};

export function AgentTable({ agents }: { agents: AgentRow[] }) {
  return (
    <table cellPadding={8}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Identity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr key={agent.id}>
            <td>{agent.id}</td>
            <td>{agent.identity}</td>
            <td>{agent.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
