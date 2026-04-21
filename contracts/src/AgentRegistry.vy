# @version 0.3.10

import src.interfaces.IERC8004 as IERC8004


struct AgentRecord:
    owner: address
    metadata_uri: String[256]
    exists: bool

identity_registry: public(address)
agents: HashMap[uint256, AgentRecord]

event AgentRegistered:
    agent_id: indexed(uint256)
    owner: indexed(address)
    metadata_uri: String[256]

event AgentMetadataUpdated:
    agent_id: indexed(uint256)
    metadata_uri: String[256]


@external
def __init__(identity_registry_: address):
    self.identity_registry = identity_registry_

@external
def register_agent(agent_id: uint256, owner: address, metadata_uri: String[256]):
    assert owner != empty(address), "invalid-owner"
    assert not self.agents[agent_id].exists, "already-registered"

    if self.identity_registry != empty(address):
        assert IERC8004(self.identity_registry).owner_of(agent_id) == owner, "owner-mismatch"

    self.agents[agent_id] = AgentRecord({
        owner: owner,
        metadata_uri: metadata_uri,
        exists: True,
    })

    log AgentRegistered(agent_id, owner, metadata_uri)

@external
def set_metadata(agent_id: uint256, metadata_uri: String[256]):
    record: AgentRecord = self.agents[agent_id]
    assert record.exists, "not-registered"
    assert record.owner == msg.sender, "not-owner"

    if self.identity_registry != empty(address):
        assert IERC8004(self.identity_registry).owner_of(agent_id) == msg.sender, "owner-mismatch"

    self.agents[agent_id].metadata_uri = metadata_uri
    log AgentMetadataUpdated(agent_id, metadata_uri)

@view
@external
def owner_of(agent_id: uint256) -> address:
    return self.agents[agent_id].owner

@view
@external
def metadata_of(agent_id: uint256) -> String[256]:
    return self.agents[agent_id].metadata_uri

@view
@external
def is_registered(agent_id: uint256) -> bool:
    return self.agents[agent_id].exists
