// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.9;

import "@gnosis.pm/zodiac/contracts/interfaces/IAvatar.sol";
import "./MultisendEncoder.sol";
import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorPreventLateQuorumUpgradeable.sol";

contract OZGovernorModule is
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorPreventLateQuorumUpgradeable
{
    /// @dev Emitted each time the multisend address is set.
    event MultisendSet(address indexed multisend);
    /// @dev Emitted each time the Target is set.
    event TargetSet(address indexed previousTarget, address indexed newTarget);
    /// @dev Emitted each time ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    /// @dev Emitted upon successful setup
    event OZGovernorModuleSetUp(address indexed owner, address indexed target);

    /// @dev Transaction execution failed.
    error TransactionsFailed();

    /// @dev Functions restricted to `onlyGovernance()` are only callable by `owner`.
    address public owner;
    /// @dev Address of the multisend contract that this contract should use to bundle transactions.
    address public multisend;
    /// @dev Address that this module will pass transactions to.
    address public target;

    /// @param _owner Address that will be able to call functions protected onlyGovernance() functions.
    /// @param _target Address on which this contract will call `execTransactionFromModule()`.
    /// @param _multisend Address of the multisend contract to be used for batches of transactions.
    /// @param _token Address of the votes token to be used for governance.
    /// @param _name Name of this Governor Module.
    /// @param _votingDelay Delay, in blocks, before voting opens on new proposals.
    /// @param _votingPeriod Period, in blocks, during which voters can cast votes.
    /// @param _proposalThreshold Balance of tokens that an account must hold in order to create a proposal.
    /// @param _quorum Quorum numerator value, denominator is 100. A value of 10 is equivlant to a 10% quorum.
    /// @param _initialVoteExtension the number of blocks that are required to pass from when a proposal reaches quorum until its voting period ends.
    constructor(
        address _owner,
        address _target,
        address _multisend,
        address _token,
        string memory _name,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorum,
        uint64 _initialVoteExtension
    ) {
        bytes memory initializeParams = abi.encode(
            _owner,
            _target,
            _multisend,
            _token,
            _name,
            _votingDelay,
            _votingPeriod,
            _proposalThreshold,
            _quorum,
            _initialVoteExtension
        );
        setUp(initializeParams);
    }

    /// @dev Initialize function, should be called immediately after deploying a new proxy to this contract.
    /// @param initializeParams ABI encoded parameters, in the same order as the constructor.
    /// @notice Can only be called once.
    function setUp(bytes memory initializeParams) public initializer {
        (
            address _owner,
            address _target,
            address _multisend,
            address _token,
            string memory _name,
            uint256 _votingDelay,
            uint256 _votingPeriod,
            uint256 _proposalThreshold,
            uint256 _quorum,
            uint64 _initialVoteExtension
        ) = abi.decode(
                initializeParams,
                (address, address, address, address, string, uint256, uint256, uint256, uint256, uint64)
            );
        owner = _owner;
        target = _target;
        multisend = _multisend;
        __Governor_init(_name);
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotesUpgradeable(_token));
        __GovernorVotesQuorumFraction_init(_quorum);
        __GovernorPreventLateQuorum_init(_initialVoteExtension);
        emit OZGovernorModuleSetUp(_owner, _target);
    }

    /// @dev Execute via a Zodiac avatar, like a Gnosis Safe.
    function _execute(
        uint256, /* proposalId */
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal override {
        (address to, uint256 value, bytes memory data, Enum.Operation operation) = MultisendEncoder.encodeMultisend(
            multisend,
            targets,
            values,
            calldatas
        );
        bool success = IAvatar(target).execTransactionFromModule(to, value, data, operation);
        if (!success) {
            revert TransactionsFailed();
        }
    }

    /// @dev Transfers ownership of this contract to a new address.
    /// @param _owner Address of the account to be set as the new owner.
    /// @notice Can only be called by `owner`.
    function transferOwnership(address _owner) public onlyGovernance {
        emit OwnershipTransferred(owner, _owner);
        owner = _owner;
    }

    /// @dev Sets the address of the multisend contract to be used for batched of transactions.
    /// @param _multisend Address of the multisend contract to be used.
    /// @notice Can only be called by `owner`.
    function setMultisend(address _multisend) public onlyGovernance {
        multisend = _multisend;
        emit MultisendSet(_multisend);
    }

    /// @dev Sets the address of the target contract, on which this contract will call `execTransactionFromModule()`.
    /// @param _target Address of the target contract to be used.
    /// @notice Can only be called by `owner`.
    function setTarget(address _target) public onlyGovernance {
        emit TargetSet(target, _target);
        target = _target;
    }

    /// @dev Returns `owner`.
    /// @notice This differs slightly from a typical Zodiac mod, where `owner` and `avatar`/`executor` would be distinguished.
    function _executor() internal view override returns (address) {
        return owner;
    }

    /// @dev Returns this module's version.
    function version() public pure override returns (string memory) {
        return "Zodaic OZ Governor Module: v1.0.0";
    }

    /// The following functions are overrides required by Solidity.

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual override(GovernorPreventLateQuorumUpgradeable, GovernorUpgradeable) returns (uint256) {
        return GovernorPreventLateQuorumUpgradeable._castVote(proposalId, account, support, reason);
    }

    function proposalDeadline(uint256 proposalId)
        public
        view
        virtual
        override(GovernorPreventLateQuorumUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        return GovernorPreventLateQuorumUpgradeable.proposalDeadline(proposalId);
    }

}
