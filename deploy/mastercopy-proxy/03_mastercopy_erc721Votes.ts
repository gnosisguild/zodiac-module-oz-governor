// import { deployMastercopy } from "@gnosis.pm/zodiac"
// import { ethers } from "hardhat"
// import "hardhat-deploy"
// import { DeployFunction } from "hardhat-deploy/types"
// import { HardhatRuntimeEnvironment } from "hardhat/types"
// import ERC721_CONTRACT_ARTIFACT from "../../artifacts/contracts/ERC721Votes.sol/ERC721Votes.json"

// const oneAddress = "0x0000000000000000000000000000000000000001"

// const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   console.log("Deploying ERC721 Votes Mastercopy")

//   const votesTokenContract: any = await ethers.getContractFactory("ERC721Votes")

//   const address = await deployMastercopy(hre, votesTokenContract, [oneAddress, "Votes Token", "VOTE"])

//   console.log("ERC721Votes deployed to:", address)

//   hre.deployments.save("ERC721VotesMastercopy", {
//     abi: ERC721_CONTRACT_ARTIFACT.abi,
//     address: address,
//   })
// }

// deploy.tags = ["testDependencies", "erc721VotesMastercopy"]
// export default deploy
