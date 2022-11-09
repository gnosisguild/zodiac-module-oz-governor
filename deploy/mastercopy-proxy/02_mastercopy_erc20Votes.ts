import "hardhat-deploy"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  console.log("Deploying ERC20 Votes")
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const testAvatarDeployment = await deployments.get("TestAvatar")

  const votesToken = await deploy("ERC20Votes", {
    from: deployer,
    args: [testAvatarDeployment.address, "Votes Token", "VOTE"],
  })
  console.log("ERC20Votes deployed to:", votesToken.address)
}

deploy.tags = ["testDependencies", "erc20VotesMastercopy"]
deploy.dependencies = ["testAvatar"]
export default deploy
