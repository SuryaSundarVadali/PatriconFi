from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

import boa


ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "src"


def _iter_contract_files() -> list[Path]:
    return sorted(
        path for path in SRC_DIR.rglob("*.vy") if path.is_file() and "interfaces" not in path.parts
    )


def _compile_contracts() -> None:
    contracts = _iter_contract_files()
    if not contracts:
        raise SystemExit("No Vyper contracts found under src/")

    for contract in contracts:
        try:
            boa.load_partial(str(contract))
        except Exception as exc:  # pragma: no cover - used for CI diagnostics
            raise SystemExit(
                f"Vyper compile check failed for {contract.relative_to(ROOT)}\n{exc}"
            ) from exc
        print(f"ok: {contract.relative_to(ROOT)}")


def compile_contracts() -> None:
    print("Compiling Vyper contracts via Titanoboa...")
    _compile_contracts()


def lint_contracts() -> None:
    print("Linting Vyper contracts via Titanoboa compile checks...")
    _compile_contracts()


def arc_rpc_smoke_check() -> None:
    rpc_url = sys.argv[2] if len(sys.argv) > 2 else None
    rpc_url = rpc_url or os.getenv("ARC_TEST_RPC_URL")

    if not rpc_url:
        print("ARC_TEST_RPC_URL not set; skipping Arc RPC smoke check.")
        return

    payload = json.dumps(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_chainId",
            "params": [],
        }
    ).encode("utf-8")

    request = Request(
        rpc_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            body = json.loads(response.read().decode("utf-8"))
    except URLError as exc:
        raise SystemExit(f"Arc RPC smoke check failed: {exc}") from exc

    chain_id = body.get("result")
    if not chain_id:
        raise SystemExit(f"Unexpected Arc RPC response: {body}")

    print(f"Arc RPC reachable, chainId={chain_id}")


COMMANDS = {
    "compile": compile_contracts,
    "lint": lint_contracts,
    "arc-smoke": arc_rpc_smoke_check,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        valid = ", ".join(sorted(COMMANDS))
        raise SystemExit(f"Usage: python -m scripts.contract_tasks <{valid}>")

    COMMANDS[sys.argv[1]]()


if __name__ == "__main__":
    main()
