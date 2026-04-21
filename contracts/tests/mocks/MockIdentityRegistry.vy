# @version 0.3.10

next_id: public(uint256)
owners: HashMap[uint256, address]
metadata: HashMap[uint256, String[256]]

@external
def create_identity(controller: address, metadata_uri: String[256]) -> uint256:
    identity_id: uint256 = self.next_id
    self.next_id = identity_id + 1
    self.owners[identity_id] = controller
    self.metadata[identity_id] = metadata_uri
    return identity_id

@view
@external
def owner_of(identity_id: uint256) -> address:
    return self.owners[identity_id]

@external
def set_identity_metadata(identity_id: uint256, metadata_uri: String[256]):
    self.metadata[identity_id] = metadata_uri

@external
def set_owner(identityId: uint256, owner: address):
    self.owners[identityId] = owner
