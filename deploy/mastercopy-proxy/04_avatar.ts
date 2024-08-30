// import "hardhat-deploy"
// import { DeployFunction } from "hardhat-deploy/types"
// import { HardhatRuntimeEnvironment } from "hardhat/types"

// const deploy: DeployFunction = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
//   console.log("Deploying TestAvatar.")
//   const { deploy } = deployments
//   const { deployer } = await getNamedAccounts()

//   const testAvatarDeployment = await deploy("TestAvatar", {
//     from: deployer,
//   })
//   console.log("TestAvatar deployed to:", testAvatarDeployment.address)
// }

// deploy.tags = ["testDependencies", "testAvatar"]
// export default deploy
