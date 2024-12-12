import { task } from "hardhat/config"

import { Deployer } from "@matterlabs/hardhat-zksync-deploy"
import { Wallet } from "zksync-ethers"
import { ethers } from "ethers"
import { ZkSyncArtifact } from "@matterlabs/hardhat-zksync-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const ERC_CONTRACT_ARGS = ["0x0000000000000000000000000000000000000001", "0x", "0x"]

// 🚀 MultisendEncoder: Deployed at 0xD9920581E8DabbC358A616BE09b88de8cADFfAeF
// ⏳ ERC20Votes: Deployment starting...
// The deployment is estimated to cost 0.0009026994 ETH
// 🚀 ERC20Votes: Deployed at 0x7a81046A24A40B5e6FEB0285ebBc3236749EF2fC
// ⏳ ERC721Votes: Deployment starting...
// The deployment is estimated to cost 0.0009923398 ETH
// 🚀 ERC721Votes: Deployed at 0x2E5AC7989A9194F425D0F2fa92A48381810E8F6B
// ⏳ OZGovernorModule: Deployment starting...
// The deployment is estimated to cost 0.00176351265 ETH
// 🚀 OZGovernorModule: Deployed at 0x2F7faFB5CAA3Aa3BD96A0F359f5a20Acb512241A
const deployContact = async (
  hre: HardhatRuntimeEnvironment,
  deployer: Deployer,
  artifact: ZkSyncArtifact,
  constructorArguments: any[],
) => {
  console.log(`⏳ ${artifact.contractName}: Deployment starting...`)
  const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments)
  const parsedFee = ethers.formatEther(deploymentFee)
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`)
  const contract = await deployer.deploy(artifact, constructorArguments)
  const contractAddress = await contract.getAddress()
  console.log(`🚀 ${artifact.contractName}: Deployed at ${contractAddress}`)
  // const verificationId = await hre.run("verify:verify", {
  //   address: contractAddress,
  //   contract: `contracts/${artifact.contractName}.sol:${artifact.contractName}`,
  //   constructorArguments,
  // })
  // console.log(`🚀 ${artifact.contractName}: VerificationId ${verificationId}`)
  return contractAddress
}

task("deploy:zksync", "TODO").setAction(async (_, hre) => {
  const zkWallet = new Wallet(process.env.PRIVATE_KEY!)
  const deployerZkSync = new Deployer(hre, zkWallet)

  //Deploy MultisendEncoder
  const multisendEncoderArtifact = await deployerZkSync.loadArtifact("MultisendEncoder")
  const multisendAddress = await deployContact(hre, deployerZkSync, multisendEncoderArtifact, [])

  // Deploy ERC20Votes
  const erc20VotesArtifact = await deployerZkSync.loadArtifact("ERC20Votes")
  const erc20Address = await deployContact(hre, deployerZkSync, erc20VotesArtifact, ERC_CONTRACT_ARGS)

  // Deploy ERC721Votes
  const erc721VotesArtifact = await deployerZkSync.loadArtifact("ERC721Votes")
  await deployContact(hre, deployerZkSync, erc721VotesArtifact, ERC_CONTRACT_ARGS)

  // Deploy OZGovernorModule
  const ozModuleArtifact = await deployerZkSync.loadArtifact("OZGovernorModule")
  await deployContact(hre, deployerZkSync, ozModuleArtifact, [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000001",
    erc20Address,
    "",
    0,
    100,
    0,
    10,
    0,
  ])
})
