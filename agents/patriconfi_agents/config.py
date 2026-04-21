from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    gateway_base_url: str
    x402_base_url: str
    aisa_base_url: str
    arc_rpc_url: str
    activity_ledger_address: str
    buyer_agent_id: int
    seller_agent_id: int
    interaction_count: int
    price_microusdc: int
    buyer_wallet_address: str


def load_settings() -> Settings:
    return Settings(
        gateway_base_url=os.getenv("PATRI_GATEWAY_BASE_URL", "https://gateway.local"),
        x402_base_url=os.getenv("PATRI_X402_BASE_URL", "https://x402.local"),
        aisa_base_url=os.getenv("PATRI_AISA_BASE_URL", "https://aisa.local"),
        arc_rpc_url=os.getenv("PATRI_ARC_RPC_URL", "https://arc-rpc.local"),
        activity_ledger_address=os.getenv(
            "PATRI_ACTIVITY_LEDGER_ADDRESS",
            "0x0000000000000000000000000000000000000000",
        ),
        buyer_agent_id=int(os.getenv("PATRI_BUYER_AGENT_ID", "1")),
        seller_agent_id=int(os.getenv("PATRI_SELLER_AGENT_ID", "2")),
        interaction_count=int(os.getenv("PATRI_INTERACTION_COUNT", "50")),
        price_microusdc=int(os.getenv("PATRI_PRICE_MICROUSDC", "2500")),
        buyer_wallet_address=os.getenv(
            "PATRI_BUYER_WALLET_ADDRESS",
            "0x000000000000000000000000000000000000b001",
        ),
    )
