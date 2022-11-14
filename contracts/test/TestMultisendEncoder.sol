// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "../MultisendEncoder.sol";

contract TestMultisendEncoder {
    function encodeMultisend(
        address multisend,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    )
        public
        pure
        returns (
            address to,
            uint256 value,
            bytes memory data,
            Enum.Operation operation
        )
    {
        (to, value, data, operation) = MultisendEncoder.encodeMultisend(multisend, targets, values, calldatas);
    }
}
