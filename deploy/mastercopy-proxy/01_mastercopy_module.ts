import "hardhat-deploy"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const firstAddress = "0x0000000000000000000000000000000000000001"

const deploy: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  console.log("Deploying MultisendEncoder")

  const txDeployMultisend = await deploy("MultisendEncoder", {
    from: deployer,
    log: true,
  })

  console.log("Deploying OZGovernorModule mastercopy")
  const moduleDeployment = await deploy("OZGovernorModule", {
    from: deployer,
    args: [
      firstAddress, // owner
      firstAddress, // target
      firstAddress, // multisend
      firstAddress, // token
      "OZGovernorModule", // name
      1, // votingDelay
      1, // votingPeriod
      1, // proposalThreshold
      1, // quorum
      1, // initialVoteExtension
    ],
    libraries: {
      MultisendEncoder: txDeployMultisend.address,
    },
  })
  console.log("OZGovernorModule mastercopy deployed to:", moduleDeployment.address)
}

deploy.tags = ["moduleMastercopy"]

export default deploy
