from dataclasses import dataclass
from typing import Any

from .x402_client import X402Client


@dataclass
class AisaClient:
    base_url: str
    x402: X402Client
    payer_address: str

    def fetch_data(self, query: str) -> dict[str, Any]:
        if not query.strip():
            raise ValueError("query is required")

        response = self.x402.paid_request(
            method="POST",
            url=f"{self.base_url}/v1/aisa/query",
            payer=self.payer_address,
            json_body={"query": query},
        )
        return dict(response.json())
