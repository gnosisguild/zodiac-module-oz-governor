import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-ethers"
import "@matterlabs/hardhat-zksync-solc"
import "@matterlabs/hardhat-zksync-deploy"
import "@matterlabs/hardhat-zksync-verify"
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
  zksolc: {
    version: "1.5.7",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
        libraries: {
              "contracts/MultisendEncoder.sol": {
                "MultisendEncoder": "0x8D29A928a8932EbcC07D1Cd11409A966584A0467"
              }
            }
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
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true,
      accounts: sharedNetworkConfig.accounts,
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
      accounts: sharedNetworkConfig.accounts,
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
    apiKey: process.env.ETHERSCAN_API_KEY ?? process.env.ZKSYNC_EXPLORER_API_KEY,
  },
}

export default config
