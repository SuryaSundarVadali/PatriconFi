export type ArcTransferRequest = {
  from: string;
  to: string;
  amount: bigint;
};

export function buildArcUsdcTransfer(request: ArcTransferRequest) {
  if (!request.from || !request.to) {
    throw new Error("from and to are required");
  }
  if (request.amount <= 0n) {
    throw new Error("amount must be positive");
  }

  return {
    method: "transfer",
    args: [request.to, request.amount],
  };
}
