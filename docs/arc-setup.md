# Arc Setup

This guide covers local setup for Arc Testnet, USDC faucet flow, contract deployment, and transaction verification.

## Products Used and Why

Circle products used:

- Circle Faucet for test USDC: bootstraps buyer-side test balances without real funds.
- Circle Gateway Nanopayments: runtime balance and settlement API used by agents.

Arc products used:

- Arc Testnet network configuration: wallet and app chain target.
- Arc RPC endpoint: contract deployment and transaction submission.
- Arc Block Explorer: deployment and transaction verification.
- USDC on Arc: contract and runtime monetary unit, including gas-related operating assumptions for this stack.

Why chosen:

- Arc Testnet lets teams validate payment and interaction logic against realistic chain behavior.
- USDC-denominated testing mirrors production accounting assumptions.

## 1. Add Arc Testnet to Wallet

Use official Arc values from current Arc/Circle developer documentation.

Required fields:

- Network Name: Arc Testnet
- RPC URL: official Arc Testnet RPC URL
- Chain ID: official Arc Testnet chain id
- Currency Symbol: official native token symbol
- Block Explorer URL: official Arc explorer URL

## 2. Obtain Test USDC

- Open the official Circle faucet: https://faucet.circle.com/
- Select Arc Testnet.
- Request USDC to your test wallet address.
- Wait for faucet transfer confirmation in Arc explorer.

## 3. Configure Environment

Frontend example in web/.env.local:

- NEXT_PUBLIC_ARC_CHAIN_NAME
- NEXT_PUBLIC_ARC_CHAIN_ID
- NEXT_PUBLIC_ARC_RPC_URL
- NEXT_PUBLIC_ARC_EXPLORER_NAME
- NEXT_PUBLIC_ARC_EXPLORER_URL
- NEXT_PUBLIC_ARC_USDC_ADDRESS

Agent runtime environment:

- PATRI_ARC_RPC_URL
- PATRI_ACTIVITY_LEDGER_ADDRESS
- PATRI_GATEWAY_BASE_URL
- PATRI_X402_BASE_URL
- PATRI_AISA_BASE_URL

Do not place real private keys in .env files.

## 4. Deploy Contracts

From contracts folder:

- Install dependencies and tooling.
- Deploy AgentRegistry with identity registry address.
- Deploy AgentVault with Arc USDC and identity registry addresses.
- Deploy ActivityLedger with orchestrator address.

Record deployed addresses and copy them into app/runtime configuration.

## 5. Verify on Arc Explorer

For each deployment or interaction transaction:

- Open Arc explorer.
- Search transaction hash or contract address.
- Confirm status is successful.
- Confirm expected method and arguments:
  - register_agent
  - set_metadata
  - record_interaction

## 6. Fast Smoke Test

- Run contracts tests locally.
- Run agent demo burst.
- Open dashboard and confirm interaction count and average price metrics.
