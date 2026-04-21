from pathlib import Path

import boa


ROOT = Path(__file__).resolve().parents[1]


def _load(path: str, *args):
    return boa.load(str(ROOT / path), *args)


def test_deposit_and_withdraw_happy_path() -> None:
    usdc = _load("tests/mocks/MockUSDC.vy")
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    vault = _load("src/AgentVault.vy", usdc.address, identity.address)

    payer = boa.env.generate_address()
    owner = boa.env.generate_address()
    agent_id = 101

    identity.set_owner(agent_id, owner)
    usdc.mint(payer, 2_000_000)

    with boa.env.prank(payer):
        usdc.approve(vault.address, 1_000_000)
        vault.deposit(agent_id, 1_000_000)

    assert vault.balance_of(agent_id) == 1_000_000

    with boa.env.prank(owner):
        vault.withdraw(agent_id, 300_000)

    assert vault.balance_of(agent_id) == 700_000
    assert usdc.balanceOf(owner) == 300_000


def test_withdraw_reverts_for_non_owner() -> None:
    usdc = _load("tests/mocks/MockUSDC.vy")
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    vault = _load("src/AgentVault.vy", usdc.address, identity.address)

    payer = boa.env.generate_address()
    owner = boa.env.generate_address()
    attacker = boa.env.generate_address()
    agent_id = 5

    identity.set_owner(agent_id, owner)
    usdc.mint(payer, 1_000_000)

    with boa.env.prank(payer):
        usdc.approve(vault.address, 500_000)
        vault.deposit(agent_id, 500_000)

    with boa.env.prank(attacker):
        with boa.reverts("not-agent-owner"):
            vault.withdraw(agent_id, 1)


def test_deposit_reverts_on_zero_amount() -> None:
    usdc = _load("tests/mocks/MockUSDC.vy")
    identity = _load("tests/mocks/MockIdentityRegistry.vy")
    vault = _load("src/AgentVault.vy", usdc.address, identity.address)

    with boa.reverts("invalid-amount"):
        vault.deposit(1, 0)
