/* eslint-disable node/no-unsupported-features/es-syntax */

import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "hardhat-gas-reporter"
import "solidity-coverage"
import * as dotenv from "dotenv"
import type { HttpNetworkUserConfig } from "hardhat/types"
// import "@nomiclabs/hardhat-etherscan"
// import "@nomiclabs/hardhat-ethers"
// import "@nomiclabs/hardhat-waffle"
// import "@typechain/hardhat"
// import "hardhat-gas-reporter"
// import "solidity-coverage"
// import "hardhat-deploy"
// import "hardhat-contract-sizer"

dotenv.config()

const DEFAULT_MNEMONIC = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"

const sharedNetworkConfig: HttpNetworkUserConfig = {}
if (process.env.PRIVATE_KEY) {
  sharedNetworkConfig.accounts = [process.env.PRIVATE_KEY]
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
  }
}

const config = {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "src/deploy", // BEFORE: deploy/raw
    sources: "contracts",
  },
  solidity: {
    compilers: [{ version: "0.8.9" }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    hardhat: { tags: ["moduleProxy"] },
    mainnet: {
      ...sharedNetworkConfig,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    },
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: "https://rpc.gnosischain.com",
    },
    matic: {
      ...sharedNetworkConfig,
      url: "https://rpc-mainnet.maticvigil.com",
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      tags: ["moduleMastercopy"],
    },
  },

  namedAccounts: {
    deployer: 0,
    dependenciesDeployer: 1,
    tester: 2,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}

export default config
