# Zodiac OZ Governor Module

[![Build Status](https://github.com/gnosis/zodiac-module-oz-governor/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-module-oz-governor/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-module-oz-governor/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-module-bridge?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)

The OZ Governor Module belongs to the [Zodiac](https://github.com/gnosis/zodiac) collection of tools, which can be accessed through the Zodiac App available on [Gnosis Safe](https://gnosis-safe.io/), as well as in this repository.

If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates.

### About the OZ Governor Module

The OZ Governor Module is an opinionated implementation of [OpenZeppelin's Governor](https://docs.openzeppelin.com/contracts/4.x/api/governance) contracts designed to be used in a Zodiac-style setup, allowing a Avatar (like a Gnosis Safe) to controlled by on-chain governance similar to [Compound's Governor Alpha and Bravo](https://compound.finance/docs/governance).

This module makes no changes to the existing Governor interface, in order to maintain compatibility with existing applications that support Governor. However, it does modify the behaviour of some existing functions, along with adding some additional functions, to enable it to be more easily used with an avatar.

Specifically, the following changes are important to note:
1. `_exdcutor()` returns the address stored at `owner`. So all `onlyGovernance()` checks are now equivalent to `onlyOwner()` checks.
2. `owner` can be set with `transferOwnership()`. This is important for enabling complex governance setups where the avatar may differ from the account that owns the governor module.
4. `execute` encodes the provided array of transactions as a delegate call to the [multisend contract](https://github.com/safe-global/safe-contracts/blob/main/contracts/libraries/MultiSend.sol) and triggers a call to `execTransactionFromModule()` on the address stored at `target`. This enables governor to be chained with other modifiers, like the [Delay](https://github.com/gnosis/zodiac-modifier-delay/) or [Roles](https://github.com/gnosis/zodiac-modifier-roles/) modifiers.

**Warning:** Tokens or value MUST NEVER be sent to the address of a deployed instance of this module, as they will be immediately lost. Rather, all value should be stored in the attached avatar (Gnosis Safe).

## Commands
```
yarn install # install dependencies
yarn build # compiles contracts
yarn coverage # runs the tests and displays contract coverage report
```

#### Deployment

For each command, the network can be specified by adding the network argument, for instance `--network hardhat`.

For a full test setup run:

```
yarn deploy
```

This will deploy a mastercopy for the module, a mastercopy of the ERC20Votes token, a mastercopy of the ERC721Votes token. Then it will deploy a test avatar, and create a minimal proxy for the ERC20 Votes token and set up a minimal proxy for the module (using the test avatar and ERC20 Votes proxy).

To deploy the mastercopy of the module:

```
yarn deploy --tags moduleMastercopy
```

To deploy the mastercopy of the ERC20 Votes token:

```
yarn deploy --tags erc20VotesMastercopy
```

To deploy the mastercopy of the ERC721 Votes token:

```
yarn deploy --tags erc721VotesMastercopy
```
### License

Created under the [LGPL-3.0+ license](LICENSE).

### Audits

An audit has been performed by the [G0 group](https://github.com/g0-group).

All issues and notes of the audit have been addressed in commit [e8281f03779427cd1716e078b712f42473f36e7c](https://github.com/gnosis/zodiac-module-oz-governor/tree/e8281f03779427cd1716e078b712f42473f36e7c/contracts).

The audit results are available as a pdf in [this repo](audits/ZodiacOZGovernorModuleModuleNov2022.pdf).

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
