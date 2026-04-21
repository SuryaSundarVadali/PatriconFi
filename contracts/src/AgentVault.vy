# @version 0.3.10

import src.interfaces.IERC20_USDC as IERC20_USDC
import src.interfaces.IERC8004 as IERC8004

usdc: public(address)
identity_registry: public(address)
balances: HashMap[uint256, uint256]

USDC_DECIMALS: constant(uint8) = 6

event Deposit:
    agent_id: indexed(uint256)
    payer: indexed(address)
    amount: uint256

event Withdrawal:
    agent_id: indexed(uint256)
    owner: indexed(address)
    amount: uint256

@external
def __init__(usdc_token: address, identity_registry_: address):
    assert usdc_token != empty(address), "invalid-usdc"
    assert identity_registry_ != empty(address), "invalid-registry"

    self.usdc = usdc_token
    self.identity_registry = identity_registry_

    assert IERC20_USDC(self.usdc).decimals() == USDC_DECIMALS, "unexpected-decimals"

@external
def deposit(agent_id: uint256, amount: uint256):
    assert amount > 0, "invalid-amount"

    ok: bool = IERC20_USDC(self.usdc).transferFrom(msg.sender, self, amount)
    assert ok, "transfer-failed"

    self.balances[agent_id] += amount
    log Deposit(agent_id, msg.sender, amount)

@external
def withdraw(agent_id: uint256, amount: uint256):
    assert amount > 0, "invalid-amount"

    owner: address = IERC8004(self.identity_registry).owner_of(agent_id)
    assert owner == msg.sender, "not-agent-owner"
    assert self.balances[agent_id] >= amount, "insufficient-balance"

    self.balances[agent_id] -= amount

    ok: bool = IERC20_USDC(self.usdc).transfer(msg.sender, amount)
    assert ok, "transfer-failed"

    log Withdrawal(agent_id, msg.sender, amount)

@view
@external
def balance_of(agent_id: uint256) -> uint256:
    return self.balances[agent_id]
