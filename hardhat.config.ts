import * as dotenv from "dotenv"
import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@typechain/hardhat"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "hardhat-deploy"
import "hardhat-contract-sizer"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.9" }],
    settings: {
      // optimizer: {
      //   enabled: true,
      //   runs: 1,
      // },
    },
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      deploy: ["deploy/mastercopy-proxy"], // deploy via mastercopy and a proxy
      tags: ["moduleMastercopy"],
    },
    hardhat: {
      forking: {
        url: process.env.GOERLI_URL || "",
      },
      deploy: ["deploy/mastercopy-proxy"], // deploy via mastercopy and a proxy
      tags: ["moduleProxy"],
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
  paths: {
    deploy: "deploy/raw", // normal deployment
  },
}

export default config
