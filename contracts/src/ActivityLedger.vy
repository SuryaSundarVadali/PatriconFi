# @version 0.3.10

struct Interaction:
    agent_from: uint256
    agent_to: uint256
    price_usdc: uint256
    resource_id: bytes32
    timestamp: uint256

orchestrator: public(address)
interaction_count: public(uint256)
interactions: public(HashMap[uint256, Interaction])

event InteractionRecorded:
    interaction_id: indexed(uint256)
    agent_from: indexed(uint256)
    agent_to: indexed(uint256)
    price_usdc: uint256
    resource_id: bytes32
    timestamp: uint256


@external
def __init__(orchestrator_: address):
    assert orchestrator_ != empty(address), "invalid-orchestrator"
    self.orchestrator = orchestrator_

@external
def record_interaction(agent_from: uint256, agent_to: uint256, price_usdc: uint256, resource_id: bytes32) -> uint256:
    assert msg.sender == self.orchestrator, "not-orchestrator"
    assert price_usdc > 0, "invalid-price"

    interaction_id: uint256 = self.interaction_count
    timestamp_: uint256 = block.timestamp

    self.interactions[interaction_id] = Interaction({
        agent_from: agent_from,
        agent_to: agent_to,
        price_usdc: price_usdc,
        resource_id: resource_id,
        timestamp: timestamp_,
    })
    self.interaction_count = interaction_id + 1

    log InteractionRecorded(interaction_id, agent_from, agent_to, price_usdc, resource_id, timestamp_)

    return interaction_id
