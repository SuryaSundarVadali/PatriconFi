import httpx
import json

from patriconfi_agents.gateway_client import GatewayClient


def test_gateway_deposit_balance_and_sync_shapes() -> None:
    captured: list[tuple[str, str, dict[str, object] | None]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v1/nanopayments/deposits":
            body = json.loads(request.content.decode("utf-8"))
            captured.append((request.method, request.url.path, body))
            return httpx.Response(200, json={"status": "accepted", "depositId": "dep-1"})
        if request.url.path == "/v1/nanopayments/balances/0xbuyer":
            captured.append((request.method, request.url.path, None))
            return httpx.Response(200, json={"availableMicrousdc": "7000"})
        if request.url.path == "/v1/nanopayments/sync-settlement":
            body = json.loads(request.content.decode("utf-8"))
            captured.append((request.method, request.url.path, body))
            return httpx.Response(200, json={"synced": True})
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    http = httpx.Client(transport=transport)
    client = GatewayClient(base_url="https://gateway.local", client=http)

    deposit = client.deposit("0xbuyer", 2500)
    balance = client.get_balance("0xbuyer")
    settlement = client.sync_settlement()

    assert deposit["status"] == "accepted"
    assert int(balance["availableMicrousdc"]) == 7000
    assert settlement["synced"] is True
    assert captured[0][2] == {
        "buyerAddress": "0xbuyer",
        "amount": "2500",
        "currency": "USDC",
    }
