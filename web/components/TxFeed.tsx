type TxItem = {
  id: string;
  amountMicrousdc: number;
  status: string;
};

export function TxFeed({ items }: { items: TxItem[] }) {
  return (
    <section>
      <h3>Recent Nanopayments</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.id}: {item.amountMicrousdc} micro-USDC ({item.status})
          </li>
        ))}
      </ul>
    </section>
  );
}
