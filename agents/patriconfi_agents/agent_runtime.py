from dataclasses import dataclass
from typing import Any

from .aisa_client import AisaClient
from .arc_client import ArcClient
from .config import Settings, load_settings
from .gateway_client import GatewayClient


@dataclass(frozen=True)
class BuyerAgent:
    agent_id: int
    wallet_address: str


@dataclass(frozen=True)
class SellerAgent:
    agent_id: int
    model_name: str


@dataclass(frozen=True)
class DemoStats:
    total_calls: int
    total_spent_microusdc: int
    avg_price_microusdc: int
    interaction_records: int


@dataclass
class AgentRuntime:
    buyer: BuyerAgent
    seller: SellerAgent
    gateway: GatewayClient
    aisa: AisaClient
    arc: ArcClient

    def _ensure_balance(self, target_amount_microusdc: int) -> None:
        balance_payload = self.gateway.get_balance(self.buyer.wallet_address)
        available = int(balance_payload.get("availableMicrousdc", 0))
        if available >= target_amount_microusdc:
            return

        self.gateway.deposit(self.buyer.wallet_address, target_amount_microusdc - available)

    def perform_paid_call(self, query: str, price_microusdc: int, interaction_index: int) -> dict[str, Any]:
        if price_microusdc <= 0:
            raise ValueError("price_microusdc must be positive")

        self._ensure_balance(price_microusdc)
        result = self.aisa.fetch_data(query)

        resource_id = f"call-{interaction_index:064x}"
        self.arc.record_interaction(
            agent_from=self.buyer.agent_id,
            agent_to=self.seller.agent_id,
            price_usdc=price_microusdc,
            resource_id=resource_id,
        )
        return result

    def demo_run(self, count: int, price_microusdc: int) -> DemoStats:
        if count < 50:
            raise ValueError("count must be at least 50")
        if price_microusdc >= 10_000:
            raise ValueError("price_microusdc must be below one cent")

        for i in range(count):
            self.perform_paid_call(
                query=f"{self.seller.model_name}: request-{i}",
                price_microusdc=price_microusdc,
                interaction_index=i,
            )

        self.gateway.sync_settlement()

        total_spent = count * price_microusdc
        return DemoStats(
            total_calls=count,
            total_spent_microusdc=total_spent,
            avg_price_microusdc=price_microusdc,
            interaction_records=count,
        )


def create_app(runtime: AgentRuntime) -> Any:
    from fastapi import FastAPI

    app = FastAPI(title="PatriconFi Agents API", version="0.1.0")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/demo")
    def demo() -> dict[str, int]:
        stats = runtime.demo_run(count=50, price_microusdc=2_500)
        return {
            "total_calls": stats.total_calls,
            "total_spent_microusdc": stats.total_spent_microusdc,
            "avg_price_microusdc": stats.avg_price_microusdc,
            "interaction_records": stats.interaction_records,
        }

    return app


def _build_runtime(settings: Settings) -> AgentRuntime:
    # Orchestrator signing must come from secure custody/keystore integration.
    class PlaceholderSigner:
        def sign_transaction(self, tx_payload: dict[str, Any]) -> str:
            _ = tx_payload
            return "0xdeadbeef"

    gateway = GatewayClient(base_url=settings.gateway_base_url)
    from .x402_client import X402Client

    class PlaceholderAuthSigner:
        def sign_eip712(self, typed_data: dict[str, Any]) -> dict[str, str]:
            _ = typed_data
            return {"signature": "0xplaceholder", "type": "EIP-3009"}

    x402 = X402Client(base_url=settings.x402_base_url, signer=PlaceholderAuthSigner())
    aisa = AisaClient(base_url=settings.aisa_base_url, x402=x402, payer_address=settings.buyer_wallet_address)
    arc = ArcClient(
        rpc_url=settings.arc_rpc_url,
        activity_ledger_address=settings.activity_ledger_address,
        signer=PlaceholderSigner(),
    )
    return AgentRuntime(
        buyer=BuyerAgent(agent_id=settings.buyer_agent_id, wallet_address=settings.buyer_wallet_address),
        seller=SellerAgent(agent_id=settings.seller_agent_id, model_name="aisa-nano"),
        gateway=gateway,
        aisa=aisa,
        arc=arc,
    )


def demo_run() -> DemoStats:
    settings = load_settings()
    runtime = _build_runtime(settings)
    return runtime.demo_run(count=settings.interaction_count, price_microusdc=settings.price_microusdc)


def main() -> None:
    stats = demo_run()
    print(f"total_calls={stats.total_calls}")
    print(f"total_usdc_spent={stats.total_spent_microusdc / 1_000_000:.6f}")
    print(f"avg_price_usdc={stats.avg_price_microusdc / 1_000_000:.6f}")
