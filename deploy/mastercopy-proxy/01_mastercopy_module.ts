// import { ethers } from "hardhat"
// import "hardhat-deploy"
// import { DeployFunction } from "hardhat-deploy/types"
// import { HardhatRuntimeEnvironment } from "hardhat/types"
// import { deployMastercopy } from "@gnosis.pm/zodiac"
// import MODULE_CONTRACT_ARTIFACT from "../../artifacts/contracts/OZGovernorModule.sol/OZGovernorModule.json"

// const firstAddress = "0x0000000000000000000000000000000000000001"

// const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { deploy } = hre.deployments
//   const { deployer } = await hre.getNamedAccounts()

//   console.log("Deploying MultisendEncoder")

//   const txDeployMultisend = await deploy("MultisendEncoder", {
//     from: deployer,
//     log: true,
//   })

//   const contract: any = await ethers.getContractFactory("OZGovernorModule", {
//     libraries: { MultisendEncoder: txDeployMultisend.address },
//   })

//   console.log("Deploying OZGovernorModule mastercopy")
//   const address = await deployMastercopy(hre, contract, [
//     firstAddress, // owner
//     firstAddress, // target
//     firstAddress, // multisend
//     firstAddress, // token
//     "OZGovernorModule", // name
//     1, // votingDelay
//     1, // votingPeriod
//     1, // proposalThreshold
//     1, // quorum
//     1, // initialVoteExtension
//   ])

//   console.log("OZGovernorModule mastercopy deployed to:", address)

//   hre.deployments.save("OZGovernorModule", {
//     abi: MODULE_CONTRACT_ARTIFACT.abi,
//     address: address,
//   })
// }

// deploy.tags = ["moduleMastercopy"]

// export default deploy
