# Nanopayments Flow

This document follows Circle’s Nanopayments and x402 model directly and maps it to PatriconFi runtime behavior.

## Products Used and Why

Circle products used:

- Circle Gateway Nanopayments: prefunding and net settlement for micro-priced API usage.
- Circle x402 challenge flow: standard 402 payment requirement and retry path.
- EIP-3009 authorization format over EIP-712 typed data: portable signed authorization payload for each paid call.

Arc products used:

- Arc RPC: transaction submission for interaction recording.
- USDC on Arc: payment denomination in micro-USDC.

Why chosen:

- Per-call onchain transfers are not economical for sub-cent calls.
- Gateway keeps call latency and cost profile practical while preserving settlement guarantees.

## Buy-Side Flow

1. Price is set per call in micro-USDC, with guardrail below 10,000 micro-USDC (below $0.01).
2. Buyer balance is checked via Gateway balance endpoint.
3. If balance is short, buyer wallet is prefunded via Gateway deposit endpoint.
4. Buyer calls paid API endpoint without payment header.
5. API returns HTTP 402 with payment requirements and typed data.
6. Buyer signs typed data (EIP-712) to create EIP-3009-compatible authorization payload.
7. Buyer retries the same request with X-PAYMENT header carrying scheme, network, payTo, amount, payer, and authorization.
8. API validates payment data and serves response.

## Sell-Side Flow

1. Seller endpoint publishes payment requirements in 402 challenge.
2. Seller receives retried request with X-PAYMENT header.
3. Seller-side payment verification accepts or rejects authorization.
4. On success, seller serves the requested model/data output.
5. Settlement is batched and synced through Gateway settlement endpoint.

## PatriconFi Runtime Mapping

- Prefund and balance checks: Gateway deposit + balance endpoints.
- 402 handling: first attempt intentionally unpaid, then retry with payment header.
- Signing path: EIP-712 typed data signed into EIP-3009-style authorization object.
- Post-call accounting: successful calls are written to ActivityLedger on Arc.
- Batch settlement: runtime triggers sync settlement after demo interaction burst.

## Why Gateway Is Required for Sub-Cent Calls

PatriconFi targets prices such as 2,500 micro-USDC ($0.0025) per call.
At this price point, a one-transaction-per-call onchain model would erase margin because each call would carry full transaction overhead.
Gateway changes the unit economics by netting many calls and settling in batches, so revenue per call can remain positive while prices stay below one cent.

## Pricing Guidance Used in This Codebase

- Hard guardrail: per-call price must be under 10,000 micro-USDC.
- Demo default: 2,500 micro-USDC per call.
- Minimum interaction count in demo: 50 calls, so fixed overhead is spread across a meaningful batch.
