// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.9;

import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "./MultisendEncoder.sol";
import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";

contract OZGovernorModule is Module, MultisendEncoder, GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable {
    constructor(address _owner, address _avatar, address _target, address _token, string memory _name, uint256 _votingDelay, uint256 _votingPeriod, uint256 _proposalThreshold, uint256 _quorum) {
        bytes memory initializeParams = abi.encode(_owner, _avatar, _target, _token, _name, _votingDelay, _votingPeriod, _proposalThreshold, _quorum);
        setUp(initializeParams);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param initializeParams Parameters of initialization encoded
    function setUp(bytes memory initializeParams) public override initializer {
        __Ownable_init();
        (address _owner, address _avatar, address _target, address _token, string memory _name, uint256 _votingDelay, uint256 _votingPeriod, uint256 _proposalThreshold, uint256 _quorum) = abi.decode(initializeParams, (address, address, address, address, string, uint256, uint256, uint256, uint256));

        setAvatar(_avatar);
        setTarget(_target);
        __Governor_init(_name);
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotesUpgradeable(_token));
        __GovernorVotesQuorumFraction_init(_quorum);
        transferOwnership(_owner);
    }

    /// @dev Execute via a Zodiac avatar, like a Gnosis Safe.
    function _execute(
        uint256, /* proposalId */
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal override {
        string memory errorMessage = "Governor: call reverted without message";
        require(targets.length == values.length && values.length == calldatas.length, "arrays are not equal length");
        Transaction[] memory transactions;
        for(uint8 i = 0; i < targets.length; i++){
            transactions[i].to = targets[i];
            transactions[i].value = values[i];
            transactions[i].data = calldatas[i];
            transactions[i].operation = Enum.Operation.Call;
        }
        (address to, uint256 value, bytes memory data, Enum.Operation operation) = encodeMultisend(transactions);
        exec(to, value, data, operation);
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
