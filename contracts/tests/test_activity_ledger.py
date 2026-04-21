from pathlib import Path

import boa


ROOT = Path(__file__).resolve().parents[1]


def _load(path: str, *args):
    return boa.load(str(ROOT / path), *args)


def test_record_interaction_happy_path() -> None:
    orchestrator = boa.env.generate_address()
    ledger = _load("src/ActivityLedger.vy", orchestrator)
    resource_id = b"\x11" * 32

    with boa.env.prank(orchestrator):
        interaction_id = ledger.record_interaction(1, 2, 125_000, resource_id)

    assert interaction_id == 0
    assert ledger.interaction_count() == 1

    interaction = ledger.interactions(0)
    assert interaction.agent_from == 1
    assert interaction.agent_to == 2
    assert interaction.price_usdc == 125_000


def test_record_interaction_reverts_for_non_orchestrator() -> None:
    orchestrator = boa.env.generate_address()
    non_orchestrator = boa.env.generate_address()
    ledger = _load("src/ActivityLedger.vy", orchestrator)
    resource_id = b"\x22" * 32

    with boa.env.prank(non_orchestrator):
        with boa.reverts("not-orchestrator"):
            ledger.record_interaction(1, 2, 100, resource_id)
