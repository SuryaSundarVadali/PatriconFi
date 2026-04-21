import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--orchestrator", required=True, help="authorized orchestrator address")
    args = parser.parse_args()

    contract_path = Path(__file__).resolve().parents[1] / "src" / "ActivityLedger.vy"
    print(f"compile and deploy: {contract_path}")
    print(f"constructor args: orchestrator={args.orchestrator}")


if __name__ == "__main__":
    main()
