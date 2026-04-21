# @version 0.3.10

@external
def create_identity(controller: address, metadata_uri: String[256]) -> uint256:
    pass


@view
@external
def owner_of(identity_id: uint256) -> address:
    pass


@external
def set_identity_metadata(identity_id: uint256, metadata_uri: String[256]):
    pass
