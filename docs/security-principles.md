# Security Principles

PatriconFi follows a strict separation model: user payment authorization keys stay with users, while protocol orchestration signing is isolated and operationally controlled.

## Products Used and Why

Circle products used:

- Circle Gateway + Nanopayments: reduces direct key handling needs during per-call micro-payment orchestration.
- Circle x402 flow: standardized payment challenge and authorization shape, reducing custom signing protocol surface.

Arc products used:

- Arc RPC and explorer: auditable transaction path for interaction records and contract state.
- USDC on Arc: stable-value accounting unit that keeps risk and reporting simpler than volatile-denominated pricing.

Why chosen:

- The stack keeps payment auth explicit while avoiding unnecessary direct custody of user funds in app code.

## Principles Applied

### 1. No Plaintext Key Storage

- No funded private keys in repository files.
- No real private keys in .env.
- CI uses only disposable test credentials when needed.

### 2. Hardware Wallet First for Human Operators

- Human administrative actions should be signed by hardware wallets.
- Day-to-day browser wallets on hot devices are for low-risk testing only.

### 3. Separate User Keys and Orchestrator Keys

- User-side authorizations are user-scoped and request-scoped.
- Orchestrator transaction signing is a separate trust domain.
- A compromise in one domain should not automatically compromise the other.

### 4. Key Rotation and Revocation

- Rotate orchestrator signing keys on a schedule and after incidents.
- Maintain emergency revocation and redeployment runbooks.
- Keep key identifiers and change history documented.

### 5. Multisig for Protocol Funds

- Treasury and protocol-controlled balances should be behind multisig.
- Single-key custody is not acceptable for material funds.

### 6. Least Privilege in Operations

- Use testnet-only and minimum-scope API tokens for CI.
- Restrict deployment credentials to required environments.
- Keep signing services isolated from public web surfaces.

### 7. Verifiable Onchain Audit Trail

- Record monetized interactions in ActivityLedger.
- Verify sensitive operations in Arc explorer.
- Treat explorer-visible history as source of truth for post-incident analysis.

## Cyfrin-Aligned dApp and Wallet Safety Summary

- Treat wallets as security boundaries, not convenience tools.
- Keep secret material out of code, logs, screenshots, and tickets.
- Prefer hardware-backed signing for operators.
- Use multisig for shared protocol control.
- Rehearse compromise response before production launch.
