import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-ethers"
import "hardhat-contract-sizer"
import "hardhat-gas-reporter"
import "solidity-coverage"
import dotenv from "dotenv"
import type { HttpNetworkUserConfig } from "hardhat/types"

dotenv.config()

import "./tasks/deploy-mastercopies"
import "./tasks/deploy-mastercopy"
import "./tasks/extract-mastercopy"
import "./tasks/verify-mastercopies"
import "./tasks/verify-mastercopy"

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
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
      viaIR: true,
    },
  },
  sourcify: {
    enabled: true,
  },
  networks: {
    hardhat: { tags: ["moduleProxy"] },
    mainnet: {
      ...sharedNetworkConfig,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
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
    "lisk-sepolia": {
      ...sharedNetworkConfig,
      chainId: 4202,
      url: "https://rpc.sepolia-api.lisk.com",
      gasPrice: 1000000000,
    },
    "bob-sepolia": {
      ...sharedNetworkConfig,
      chainId: 808813,
      url: "https://bob-sepolia.rpc.gobob.xyz/",
      gasPrice: 1000000000,
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
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      gnosis: process.env.GNOSISSCAN_API_KEY,
      matic: process.env.POLYGONSCAN_API_KEY,
      "lisk-sepolia": process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
      {
        network: "bob-sepolia",
        chainId: 808813,
        urls: {
          apiURL: "https://bob-sepolia.explorer.gobob.xyz/api",
          browserURL: "https://bob-sepolia.explorer.gobob.xyz",
        },
      },
    ],
  },
}

export default config
