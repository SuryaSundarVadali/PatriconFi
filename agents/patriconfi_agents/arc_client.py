from dataclasses import dataclass
from typing import Any, Mapping, Protocol

import httpx


class OrchestratorSigner(Protocol):
    def sign_transaction(self, tx_payload: Mapping[str, Any]) -> str: ...


@dataclass
class ArcClient:
    rpc_url: str
    activity_ledger_address: str
    signer: OrchestratorSigner
    client: httpx.Client | None = None

    def _http(self) -> httpx.Client:
        return self.client or httpx.Client(timeout=15.0)

    def record_interaction(
        self,
        *,
        agent_from: int,
        agent_to: int,
        price_usdc: int,
        resource_id: str,
    ) -> str:
        if price_usdc <= 0:
            raise ValueError("price_usdc must be positive")
        if not resource_id:
            raise ValueError("resource_id is required")

        tx_payload = {
            "to": self.activity_ledger_address,
            "method": "record_interaction",
            "args": [agent_from, agent_to, price_usdc, resource_id],
        }
        signed = self.signer.sign_transaction(tx_payload)

        body = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_sendRawTransaction",
            "params": [signed],
        }
        response = self._http().post(self.rpc_url, json=body)
        response.raise_for_status()

        payload = response.json()
        if "error" in payload:
            raise RuntimeError(str(payload["error"]))
        return str(payload["result"])
