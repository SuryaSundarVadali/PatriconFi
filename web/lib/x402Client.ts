export type X402PaymentHeader = {
  "X-402-Payer": string;
  "X-402-Amount-Microusdc": string;
};

export function makeX402Header(payer: string, amountMicrousdc: number): X402PaymentHeader {
  if (!payer) {
    throw new Error("payer is required");
  }
  if (amountMicrousdc <= 0) {
    throw new Error("amount must be positive");
  }

  return {
    "X-402-Payer": payer,
    "X-402-Amount-Microusdc": String(amountMicrousdc),
  };
}
