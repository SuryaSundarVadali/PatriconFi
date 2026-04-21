import { TxFeed } from "../../components/TxFeed";
import { WalletConnector } from "../../components/WalletConnector";

export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Arc Payment Dashboard</h2>
      <WalletConnector />
      <TxFeed
        items={[
          { id: "tx-1", amountMicrousdc: 250, status: "settled" },
          { id: "tx-2", amountMicrousdc: 190, status: "pending" },
        ]}
      />
    </main>
  );
}
