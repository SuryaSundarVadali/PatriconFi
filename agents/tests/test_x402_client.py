import json

import httpx

from patriconfi_agents.x402_client import X402Client


class TestSigner:
    def sign_eip712(self, typed_data: dict[str, object]) -> dict[str, str]:
        assert "types" in typed_data
        return {"type": "EIP-3009", "signature": "0xsigned"}


def test_paid_request_handles_402_then_retries_with_payment_header() -> None:
    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        if calls["count"] == 1:
            return httpx.Response(
                402,
                json={
                    "paymentRequirements": [
                        {
                            "scheme": "exact",
                            "network": "arc",
                            "payTo": "0xseller",
                            "amount": "2500",
                            "typedData": {"types": {"EIP712Domain": []}},
                        }
                    ]
                },
            )

        payment_header = request.headers.get("X-PAYMENT")
        assert payment_header is not None
        payload = json.loads(payment_header)
        assert payload["payer"] == "0xbuyer"
        assert payload["amount"] == "2500"
        assert payload["authorization"]["signature"] == "0xsigned"
        return httpx.Response(200, json={"ok": True})

    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = X402Client(base_url="https://x402.local", signer=TestSigner(), client=http)

    response = client.paid_request(
        "POST",
        "https://aisa.local/v1/aisa/query",
        payer="0xbuyer",
        json_body={"query": "ping"},
    )

    assert response.status_code == 200
    assert calls["count"] == 2
