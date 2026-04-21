import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--usdc", required=True, help="Arc USDC token contract address")
    parser.add_argument("--identity-registry", required=True, help="ERC-8004 registry contract address")
    args = parser.parse_args()

    contract_path = Path(__file__).resolve().parents[1] / "src" / "AgentVault.vy"
    print(f"compile and deploy: {contract_path}")
    print(f"constructor args: usdc={args.usdc}, identity_registry={args.identity_registry}")


if __name__ == "__main__":
    main()
