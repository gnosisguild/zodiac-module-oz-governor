import { task } from "hardhat/config"
import { ethers, ZeroHash } from "ethers"

import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core"

import packageJson from "../package.json"

const AddressOne = "0x0000000000000000000000000000000000000001"

task("extract:mastercopy", "Extracts and persists current mastercopy build artifacts").setAction(async (_, hre) => {
  writeMastercopyFromBuild({
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
      values: [
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
      ],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  })
})
