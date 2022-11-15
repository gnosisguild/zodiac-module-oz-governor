# Zodiac Module OpenZeppelin Governor

[![Build Status](https://github.com/gnosis/zodiac-mod-starter-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-mod-starter-kit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-mod-starter-kit/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-module-bridge?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)

## Deployment

For each command, the network can be specified by adding the network argument, for instance `--network hardhat`.

For a full test setup run:

```
yarn deploy --network hardhat
```

This will deploy a master copy for the module, a mastercopy of the ERC20Votes token, a mastercopy of the ERC721Votes token. Then it will deploy a test avatar, and create a minimal proxy for the ERC20 Votes token and set up a minimal proxy for the module (using the test avatar and ERC20 Votes proxy).

For deploying the mastercopy of the module:

```
yarn deploy --tags moduleMastercopy
```

For deploying the mastercopy of the ERC20 Votes token:

```
yarn deploy --tags erc20VotesMastercopy
```

For deploying the mastercopy of the ERC721 Votes token:

```
yarn deploy --tags erc721VotesMastercopy
```

- [Zodiac Documentation](https://gnosis.github.io/zodiac/docs/intro)
- [Hardhat](https://hardhat.org/getting-started/)
- [Hardhat Deploy](https://github.com/wighawag/hardhat-deploy)
