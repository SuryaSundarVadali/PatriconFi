from dataclasses import dataclass
from typing import Any, Protocol

import httpx


class CircleGatewaySDK(Protocol):
    def deposit(self, buyer_address: str, amount_microusdc: int) -> dict[str, Any]: ...

    def get_balance(self, address: str) -> dict[str, Any]: ...

    def sync_settlement(self) -> dict[str, Any]: ...


def load_circle_gateway_sdk(*, config: dict[str, Any]) -> CircleGatewaySDK | None:
    try:
        from circle_titanoboa_sdk import gateway as circle_gateway  # type: ignore
    except Exception:
        return None

    return circle_gateway.Client(config=config)


@dataclass
class GatewayClient:
    base_url: str
    api_token: str | None = None
    client: httpx.Client | None = None
    sdk: CircleGatewaySDK | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        return headers

    def _http(self) -> httpx.Client:
        return self.client or httpx.Client(timeout=15.0)

    def deposit(self, buyer_address: str, amount: int) -> dict[str, Any]:
        if not buyer_address:
            raise ValueError("buyer_address is required")
        if amount <= 0:
            raise ValueError("amount must be positive")

        if self.sdk is not None:
            return self.sdk.deposit(buyer_address=buyer_address, amount_microusdc=amount)

        payload = {
            "buyerAddress": buyer_address,
            "amount": str(amount),
            "currency": "USDC",
        }
        response = self._http().post(
            f"{self.base_url}/v1/nanopayments/deposits",
            json=payload,
            headers=self._headers(),
        )
        response.raise_for_status()
        return dict(response.json())

    def get_balance(self, address: str) -> dict[str, Any]:
        if not address:
            raise ValueError("address is required")

        if self.sdk is not None:
            return self.sdk.get_balance(address=address)

        response = self._http().get(
            f"{self.base_url}/v1/nanopayments/balances/{address}",
            headers=self._headers(),
        )
        response.raise_for_status()
        return dict(response.json())

    def sync_settlement(self) -> dict[str, Any]:
        if self.sdk is not None:
            return self.sdk.sync_settlement()

        response = self._http().post(
            f"{self.base_url}/v1/nanopayments/sync-settlement",
            json={},
            headers=self._headers(),
        )
        response.raise_for_status()
        return dict(response.json())
