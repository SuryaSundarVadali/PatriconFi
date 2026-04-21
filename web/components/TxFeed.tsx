type TxItem = {
  txHash: string;
  interactionId: string;
  agentFrom: string;
  agentTo: string;
  priceMicrousdc: string;
  timestamp: string;
  explorerUrl: string;
};

export function TxFeed({ items }: { items: TxItem[] }) {
  return (
    <section>
      <h3>Recent ActivityLedger Events</h3>
      <ul>
        {items.map((item) => (
          <li key={item.txHash}>
            #{item.interactionId} tx <a href={item.explorerUrl} target="_blank" rel="noreferrer">{item.txHash.slice(0, 12)}...</a>,
            from agent {item.agentFrom} to {item.agentTo}, price {item.priceMicrousdc} micro-USDC, at {item.timestamp}
          </li>
        ))}
      </ul>
    </section>
  );
}
