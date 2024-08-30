import { task } from "hardhat/config"

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
      values: [AddressOne, "", ""],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  })
})
