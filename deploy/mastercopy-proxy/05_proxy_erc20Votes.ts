// import { deployAndSetUpCustomModule } from "@gnosis.pm/zodiac"
// import { getChainId } from "hardhat"
// import "hardhat-deploy"
// import { DeployFunction } from "hardhat-deploy/types"
// import { HardhatRuntimeEnvironment } from "hardhat/types"

// const deploy: DeployFunction = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
//   console.log("Deploying ERC20 Votes Proxy.")
//   const { deployer } = await getNamedAccounts()
//   const deployerSigner = await ethers.getSigner(deployer)
//   const chainId = await getChainId()

//   const erc20VotesMastercopyDeployment = await deployments.get("ERC20VotesMastercopy")
//   const avatarDeployment = await deployments.get("TestAvatar")

//   const { transaction } = deployAndSetUpCustomModule(
//     erc20VotesMastercopyDeployment.address,
//     erc20VotesMastercopyDeployment.abi,
//     {
//       values: [avatarDeployment.address, "Votes Proxy Token", "PVOTE"],
//       types: ["address", "string", "string"],
//     },
//     ethers.provider as any,
//     Number(chainId),
//     Date.now().toString(),
//   )
//   const deploymentTransaction = await deployerSigner.sendTransaction(transaction)
//   const receipt = await deploymentTransaction.wait()
//   const erc20VotesProxyAddress = receipt.logs[1].address
//   console.log("ERC20Votes minimal proxy deployed to:", erc20VotesProxyAddress)
//   deployments.save("ERC20VotesProxyAddress", {
//     abi: erc20VotesMastercopyDeployment.abi,
//     address: erc20VotesProxyAddress,
//   })
// }

// deploy.tags = ["testDependencies", "erc20VotesProxy"]
// deploy.dependencies = ["erc20VotesMastercopy"]
// export default deploy
