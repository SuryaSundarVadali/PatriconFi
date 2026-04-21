# PatriconFi

PatriconFi combines Vyper contracts, Python agent orchestration, and a Next.js frontend for Arc-network demo flows.

## CI and Security Notes

CI workflows live in `.github/workflows/`:

- `contracts.yml`: Vyper/Titanoboa tests, contract lint/compile checks, optional Arc RPC smoke step.
- `agents.yml`: pytest, mypy, and ruff checks.
- `web.yml`: lint, type/build test, and Playwright end-to-end tests.

Security baseline for CI:

- Do not commit plaintext private keys, seed phrases, or funded `.env` files.
- Use GitHub Secrets only for non-custodial, throwaway test credentials when required.
- Production and serious staging deployments should use managed keystores/HSM-backed signing.

## Local Arc Testnet Setup

Use official Arc testnet values from Circle/Arc documentation and your project environment.

1. Set RPC and chain environment values:

```bash
# web/.env.local
NEXT_PUBLIC_ARC_CHAIN_NAME=Arc Testnet
NEXT_PUBLIC_ARC_CHAIN_ID=<official_chain_id>
NEXT_PUBLIC_ARC_RPC_URL=<official_arc_testnet_rpc_url>
NEXT_PUBLIC_ARC_EXPLORER_NAME=<official_explorer_name>
NEXT_PUBLIC_ARC_EXPLORER_URL=<official_explorer_url>
NEXT_PUBLIC_ARC_USDC_ADDRESS=<official_arc_usdc_address>
```

2. Add Arc Testnet to MetaMask:

- Network Name: `Arc Testnet`
- RPC URL: value used in `NEXT_PUBLIC_ARC_RPC_URL`
- Chain ID: value used in `NEXT_PUBLIC_ARC_CHAIN_ID`
- Currency Symbol: use the network native symbol from official docs
- Block Explorer URL: value used in `NEXT_PUBLIC_ARC_EXPLORER_URL`

3. Get test USDC from the official Circle faucet:

- Faucet: https://faucet.circle.com/
- Select Arc Testnet and request test USDC to your test wallet.

## Run the Full Demo End-to-End

From repository root:

1. Contracts

```bash
cd contracts
python -m pip install -e .[dev]
poe test
```

2. Agents orchestrator

```bash
cd ../agents
python -m pip install -e .[dev]
python -m patriconfi_agents.agent_runtime
```

3. Web app and e2e

```bash
cd ../web
npm ci
npm run dev
```

In a second terminal (still in `web/`):

```bash
NEXT_PUBLIC_E2E_TEST_MODE=1 npm run e2e
```

The Playwright flow covers wallet connection, agent registration, demo execution, and dashboard metrics checks.
