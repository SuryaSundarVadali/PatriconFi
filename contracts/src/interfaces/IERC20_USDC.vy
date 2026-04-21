# @version 0.3.10

@view
@external
def totalSupply() -> uint256:
    pass


@view
@external
def balanceOf(account: address) -> uint256:
    pass


@external
def transfer(to: address, amount: uint256) -> bool:
    pass


@external
def transferFrom(sender: address, recipient: address, amount: uint256) -> bool:
    pass


@external
def approve(spender: address, amount: uint256) -> bool:
    pass


@view
@external
def allowance(owner: address, spender: address) -> uint256:
    pass


@view
@external
def decimals() -> uint8:
    pass
