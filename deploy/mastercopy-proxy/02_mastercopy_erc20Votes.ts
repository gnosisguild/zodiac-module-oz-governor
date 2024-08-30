// import { deployMastercopy } from "@gnosis.pm/zodiac"
// import { ethers } from "hardhat"
// import "hardhat-deploy"
// import { DeployFunction } from "hardhat-deploy/types"
// import { HardhatRuntimeEnvironment } from "hardhat/types"
// import ERC20_CONTRACT_ARTIFACT from "../../artifacts/contracts/ERC20Votes.sol/ERC20Votes.json"

// const oneAddress = "0x0000000000000000000000000000000000000001"

// const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   console.log("Deploying ERC20 Votes Mastercopy")

//   const votesTokenContract: any = await ethers.getContractFactory("ERC20Votes")

//   const address = await deployMastercopy(hre, votesTokenContract, [oneAddress, "Votes Token", "VOTE"])

//   console.log("ERC20Votes deployed to:", address)

//   hre.deployments.save("ERC20VotesMastercopy", {
//     abi: ERC20_CONTRACT_ARTIFACT.abi,
//     address: address,
//   })
// }

// deploy.tags = ["testDependencies", "erc20VotesMastercopy"]
// export default deploy
