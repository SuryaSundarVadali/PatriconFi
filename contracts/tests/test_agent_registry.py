from pathlib import Path

import boa


ROOT = Path(__file__).resolve().parents[1]


def _load(path: str, *args):
    return boa.load(str(ROOT / path), *args)


def test_register_and_update_metadata_happy_path() -> None:
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    registry = _load("src/AgentRegistry.vy", identity.address)

    owner = boa.env.generate_address()
    agent_id = 42

    identity.set_owner(agent_id, owner)

    registry.register_agent(agent_id, owner, "ipfs://agent-42")
    assert registry.is_registered(agent_id)
    assert registry.owner_of(agent_id) == owner

    with boa.env.prank(owner):
        registry.set_metadata(agent_id, "ipfs://agent-42-v2")

    assert registry.metadata_of(agent_id) == "ipfs://agent-42-v2"


def test_register_reverts_on_owner_mismatch() -> None:
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    registry = _load("src/AgentRegistry.vy", identity.address)

    canonical_owner = boa.env.generate_address()
    provided_owner = boa.env.generate_address()
    agent_id = 7

    identity.set_owner(agent_id, canonical_owner)

    with boa.reverts("owner-mismatch"):
        registry.register_agent(agent_id, provided_owner, "ipfs://agent-7")


def test_set_metadata_reverts_for_non_owner() -> None:
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    registry = _load("src/AgentRegistry.vy", identity.address)

    owner = boa.env.generate_address()
    non_owner = boa.env.generate_address()
    agent_id = 9

    identity.set_owner(agent_id, owner)
    registry.register_agent(agent_id, owner, "ipfs://agent-9")

    with boa.env.prank(non_owner):
        with boa.reverts("not-owner"):
            registry.set_metadata(agent_id, "ipfs://should-revert")
