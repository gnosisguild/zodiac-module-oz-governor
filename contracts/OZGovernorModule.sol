// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.9;

// import "@gnosis.pm/zodiac/contracts/factory/FactoryFriendly.sol";
import "@gnosis.pm/zodiac/contracts/interfaces/IAvatar.sol";
import "./MultisendEncoder.sol";
import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";

contract OZGovernorModule is
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable
{
    // /// @dev Emitted each time the avatar address is set.
    // event AvatarSet(address indexed previousAvatar, address indexed newAvatar);
    
    /// @dev Emitted each time the multisend address is set.
    event MultisendSet(address indexed multisend);
    /// @dev Emitted each time the Target is set.
    event TargetSet(address indexed previousTarget, address indexed newTarget);
    /// @dev Emitted each time ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    /// @dev Emitted upon successful setup
    event OZGovernorModuleSetUp(
        address indexed owner,
        // address indexed avatar,
        address indexed target,
        address multisend,
        address token,
        string name,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorum
    );

    /// @dev Transaction execution failed.
    error TransactionsFailed();
    /// @dev Only callable by owner.
    error OnlyOwner();

    address public owner;
    address public avatar;
    address public multisend;
    address public target;

    constructor(
        address _owner,
        // address _avatar,
        address _target,
        address _multisend,
        address _token,
        string memory _name,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorum
    ) {
        bytes memory initializeParams = abi.encode(
            _owner,
            // _avatar,
            _target,
            _multisend,
            _token,
            _name,
            _votingDelay,
            _votingPeriod,
            _proposalThreshold,
            _quorum
        );
        setUp(initializeParams);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param initializeParams Parameters of initialization encoded
    function setUp(bytes memory initializeParams) public initializer {
        (
            address _owner,
            // address _avatar,
            address _target,
            address _multisend,
            address _token,
            string memory _name,
            uint256 _votingDelay,
            uint256 _votingPeriod,
            uint256 _proposalThreshold,
            uint256 _quorum
        ) = abi.decode(
                initializeParams,
                (address, address, address, address, string, uint256, uint256, uint256, uint256)
            );
        owner = _owner;
        // avatar = _avatar;
        target = _target;
        multisend = _multisend;
        __Governor_init(_name);
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotesUpgradeable(_token));
        __GovernorVotesQuorumFraction_init(_quorum);
        emit OZGovernorModuleSetUp(
            _owner,
            // _avatar,
            _target,
            _multisend,
            _token,
            _name,
            _votingDelay,
            _votingPeriod,
            _proposalThreshold,
            _quorum
        );
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

    function transferOwnership(address _owner) public onlyGovernance {
        emit OwnershipTransferred(owner, _owner);
        owner = _owner;
    }

    // function setAvatar(address _avatar) public onlyGovernance {
    //     emit AvatarSet(avatar, _avatar);
    //     avatar = _avatar;
    // }

    function setMultisend(address _multisend) public onlyGovernance {
        multisend = _multisend;
        emit MultisendSet(_multisend);
    }

    function setTarget(address _target) public onlyGovernance {
        emit TargetSet(target, _target);
        target = _target;
    }

    function _executor() internal view override returns (address) {
        return owner;
    }

    // The following functions are overrides required by Solidity.

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
