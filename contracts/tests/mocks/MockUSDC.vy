# @version 0.3.10

name: public(String[32])
symbol: public(String[16])
_decimals: public(uint8)
total_supply: public(uint256)

balances: HashMap[address, uint256]
allowances: HashMap[address, HashMap[address, uint256]]

@external
def __init__():
    self.name = "Mock USDC"
    self.symbol = "USDC"
    self._decimals = 6

@view
@external
def totalSupply() -> uint256:
    return self.total_supply

@view
@external
def balanceOf(account: address) -> uint256:
    return self.balances[account]

@view
@external
def decimals() -> uint8:
    return self._decimals

@external
def mint(account: address, amount: uint256):
    self.balances[account] += amount
    self.total_supply += amount

@external
def transfer(to: address, amount: uint256) -> bool:
    assert self.balances[msg.sender] >= amount, "insufficient-balance"
    self.balances[msg.sender] -= amount
    self.balances[to] += amount
    return True

@external
def approve(spender: address, amount: uint256) -> bool:
    self.allowances[msg.sender][spender] = amount
    return True

@view
@external
def allowance(owner: address, spender: address) -> uint256:
    return self.allowances[owner][spender]

@external
def transferFrom(sender: address, recipient: address, amount: uint256) -> bool:
    allowed: uint256 = self.allowances[sender][msg.sender]
    assert allowed >= amount, "insufficient-allowance"
    assert self.balances[sender] >= amount, "insufficient-balance"

    self.allowances[sender][msg.sender] = allowed - amount
    self.balances[sender] -= amount
    self.balances[recipient] += amount
    return True
