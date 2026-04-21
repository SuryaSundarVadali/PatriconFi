import json
from dataclasses import dataclass
from typing import Any, Mapping, Protocol

import httpx


class AuthorizationSigner(Protocol):
    def sign_eip712(self, typed_data: Mapping[str, Any]) -> Mapping[str, Any]: ...


@dataclass(frozen=True)
class PaymentRequirement:
    scheme: str
    network: str
    amount: int
    pay_to: str
    typed_data: dict[str, Any]


@dataclass
class X402Client:
    base_url: str
    signer: AuthorizationSigner
    client: httpx.Client | None = None

    def _http(self) -> httpx.Client:
        return self.client or httpx.Client(timeout=20.0)

    def build_payment_header(self, payer: str, requirement: PaymentRequirement) -> dict[str, str]:
        if not payer:
            raise ValueError("payer is required")

        authorization = dict(self.signer.sign_eip712(requirement.typed_data))
        payment = {
            "scheme": requirement.scheme,
            "network": requirement.network,
            "payTo": requirement.pay_to,
            "amount": str(requirement.amount),
            "payer": payer,
            "authorization": authorization,
        }
        return {
            "X-PAYMENT": json.dumps(payment, separators=(",", ":")),
        }

    def _parse_requirement(self, payload: Mapping[str, Any]) -> PaymentRequirement:
        requirements = payload.get("paymentRequirements") or payload.get("requirements") or []
        if not requirements:
            raise RuntimeError("402 response missing payment requirements")

        raw = requirements[0]
        typed_data = raw.get("typedData") or raw.get("eip712")
        if not isinstance(typed_data, dict):
            raise RuntimeError("402 response missing typed data")

        return PaymentRequirement(
            scheme=str(raw.get("scheme", "exact")),
            network=str(raw.get("network", "arc")),
            amount=int(raw["amount"]),
            pay_to=str(raw.get("payTo") or raw.get("receiver") or ""),
            typed_data=dict(typed_data),
        )

    def paid_request(
        self,
        method: str,
        url: str,
        *,
        payer: str,
        json_body: Mapping[str, Any] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> httpx.Response:
        base_headers = dict(headers or {})
        first = self._http().request(method=method, url=url, json=json_body, headers=base_headers)

        if first.status_code != 402:
            first.raise_for_status()
            return first

        challenge = first.json()
        requirement = self._parse_requirement(challenge)

        retry_headers = dict(base_headers)
        retry_headers.update(self.build_payment_header(payer, requirement))

        retry = self._http().request(method=method, url=url, json=json_body, headers=retry_headers)
        retry.raise_for_status()
        return retry
