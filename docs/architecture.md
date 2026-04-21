# Architecture

PatriconFi is split into two planes:

- Onchain settlement and audit on Arc.
- Offchain request/payment orchestration for high-frequency AI calls.

## Products Used and Why

Circle products used:

- Circle Gateway + Nanopayments API: holds prefunded balances and nets many micro-calls into settlement batches, which keeps per-call economics viable.
- x402 payment challenge flow: gives a standard 402 challenge/response pattern for paid API access.
- AIsa endpoint integration: provides the paid model endpoint the buyer calls through x402.

Arc products used:

- Arc Testnet / Arc RPC: executes contract state changes and records interaction proofs.
- Arc Block Explorer: verifies deployments and interaction transactions.
- USDC on Arc: used for call pricing, vault accounting, and gas-denominated operations in this Arc environment.

Why this stack was chosen:

- Gateway + x402 supports sub-cent API pricing without forcing one onchain transfer per model call.
- Arc gives deterministic finality behavior suitable for payment-backed interaction logging.
- Native USDC denomination simplifies accounting for both operators and users.

## Onchain Components

### AgentRegistry

Purpose:

- Registers agent identity and ownership metadata.
- Supports owner-checked metadata updates.

Role in system:

- Creates canonical agent identity before paid interactions start.
- Lets frontend and services resolve owner and metadata by agent id.

### AgentVault

Purpose:

- Tracks agent-denominated balances in USDC units.
- Anchors protocol-side accounting for treasury-style balances.

Role in system:

- Keeps value accounting onchain and queryable.
- Supports transparent balance inspection for dashboards.

### ActivityLedger

Purpose:

- Records each paid interaction with from/to agent ids, price, resource id, and timestamp.

Role in system:

- Provides tamper-evident interaction records for audits and analytics.
- Stores the proof trail for monetized AI calls after payment authorization succeeds.

## Arc Execution Model

Arc is used for deterministic confirmation behavior and predictable settlement visibility.
PatriconFi uses Arc RPC to submit signed transactions and Arc Explorer to verify inclusion.
USDC-denominated values are stored in micro-USDC precision so offchain and onchain accounting stay aligned.
This combination supports deterministic finality expectations and avoids volatile gas-accounting assumptions.

## Offchain Components

### Gateway + Nanopayments

- Checks buyer available balance.
- Tops up via Gateway deposit when needed.
- Runs batched sync settlement after interaction bursts.

### x402 Flow Handler

- First request goes without payment header.
- On 402, parses payment requirements and typed data.
- Signs EIP-712 payload (EIP-3009 style authorization object) and retries with X-PAYMENT header.

### AIsa Integration

- Sends model query to the paid AIsa endpoint.
- Relies on x402 flow to satisfy payment challenge and retry automatically.

### Agent Orchestrator

- Enforces count and price guardrails.
- Executes repeated paid calls.
- Writes each successful interaction to ActivityLedger through Arc RPC.

### Frontend

- Connects wallet on Arc network.
- Reads registry/vault/ledger state for dashboard display.
- Triggers demo flow and displays cost/interaction metrics.
