import httpx
import json

from patriconfi_agents.agent_runtime import AgentRuntime, BuyerAgent, SellerAgent
from patriconfi_agents.aisa_client import AisaClient
from patriconfi_agents.arc_client import ArcClient
from patriconfi_agents.gateway_client import GatewayClient
from patriconfi_agents.x402_client import X402Client


class TestAuthSigner:
    def sign_eip712(self, typed_data: dict[str, object]) -> dict[str, str]:
        _ = typed_data
        return {"type": "EIP-3009", "signature": "0xauth"}


class TestOrchestratorSigner:
    def sign_transaction(self, tx_payload: dict[str, object]) -> str:
        _ = tx_payload
        return "0xsigned-tx"


def test_demo_run_records_50_plus_interactions_with_subcent_pricing() -> None:
    state = {
        "available": 0,
        "records": 0,
    }

    def gateway_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v1/nanopayments/deposits":
            body = json.loads(request.content.decode("utf-8"))
            amount = int(body["amount"])
            state["available"] += amount
            return httpx.Response(200, json={"status": "accepted"})
        if request.url.path == "/v1/nanopayments/balances/0xbuyer":
            return httpx.Response(200, json={"availableMicrousdc": state["available"]})
        if request.url.path == "/v1/nanopayments/sync-settlement":
            return httpx.Response(200, json={"synced": True})
        return httpx.Response(404)

    def aisa_handler(request: httpx.Request) -> httpx.Response:
        if "x-payment" not in request.headers:
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
        state["available"] -= 2500
        return httpx.Response(200, json={"result": {"ok": True}})

    def arc_handler(request: httpx.Request) -> httpx.Response:
        state["records"] += 1
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": 1, "result": f"0xtx{state['records']}"})

    gateway_http = httpx.Client(transport=httpx.MockTransport(gateway_handler))
    aisa_http = httpx.Client(transport=httpx.MockTransport(aisa_handler))
    arc_http = httpx.Client(transport=httpx.MockTransport(arc_handler))

    runtime = AgentRuntime(
        buyer=BuyerAgent(agent_id=1, wallet_address="0xbuyer"),
        seller=SellerAgent(agent_id=2, model_name="aisa-nano"),
        gateway=GatewayClient(base_url="https://gateway.local", client=gateway_http),
        aisa=AisaClient(
            base_url="https://aisa.local",
            x402=X402Client(base_url="https://x402.local", signer=TestAuthSigner(), client=aisa_http),
            payer_address="0xbuyer",
        ),
        arc=ArcClient(
            rpc_url="https://arc-rpc.local",
            activity_ledger_address="0xledger",
            signer=TestOrchestratorSigner(),
            client=arc_http,
        ),
    )

    stats = runtime.demo_run(count=55, price_microusdc=2500)

    assert stats.total_calls >= 50
    assert stats.interaction_records == 55
    assert state["records"] == 55
    assert stats.avg_price_microusdc < 10_000
    assert stats.total_spent_microusdc == 137_500
