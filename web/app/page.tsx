import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>PatriconFi</h1>
      <p>Agent-to-agent micropayment demo on Arc with USDC settlement.</p>
      <ul>
        <li>
          <Link href="/agents">Agents</Link>
        </li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </main>
  );
}
