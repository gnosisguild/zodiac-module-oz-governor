import { task } from "hardhat/config"
import { ZeroHash } from "ethers"

import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core"

import packageJson from "../package.json"

const AddressOne = "0x0000000000000000000000000000000000000001"

task("extract:mastercopy", "Extracts and persists current mastercopy build artifacts").setAction(async (_, hre) => {
  const { address: erc20VotesAddress } = writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "ERC20Votes",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ERC20Votes.sol",
    }),
    constructorArgs: {
      types: ["address", "string", "string"],
      values: [AddressOne, "0x", "0x"],
    },
    salt: ZeroHash,
  })
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "ERC721Votes",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ERC721Votes.sol",
    }),
    constructorArgs: {
      types: ["address", "string", "string"],
      values: [AddressOne, "0x", "0x"],
    },
    salt: ZeroHash,
  })
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "MultisendEncoder",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/MultisendEncoder.sol",
    }),
    constructorArgs: {
      types: [],
      values: [],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  })

  await hre.run("verify:etherscan-get-minimal-input", {
    sourceName: "contracts/OZGovernorModule.sol",
  })

  // address _owner,
  // address _target,
  // address _multisend,
  // address _token,
  // string memory _name,
  // uint256 _votingDelay,
  // uint256 _votingPeriod,

  // uint256 _proposalThreshold,
  // uint256 _quorum,
  // uint64 _initialVoteExtension
  console.log("HELLO  " + erc20VotesAddress)
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "OZGovernorModule",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/OZGovernorModule.sol",
    }),
    constructorArgs: {
      types: [
        "address",
        "address",
        "address",
        "address",
        "string",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint64",
      ],
      values: [AddressOne, AddressOne, AddressOne, erc20VotesAddress, "", 0, 100, 0, 10, 0],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  })
})
