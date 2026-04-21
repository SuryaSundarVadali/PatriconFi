import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--identity-registry",
        default="0x0000000000000000000000000000000000000000",
        help="ERC-8004 registry address; zero address disables owner cross-checks",
    )
    args = parser.parse_args()

    contract_path = Path(__file__).resolve().parents[1] / "src" / "AgentRegistry.vy"
    print(f"compile and deploy: {contract_path}")
    print(f"constructor args: identity_registry={args.identity_registry}")


if __name__ == "__main__":
    main()
