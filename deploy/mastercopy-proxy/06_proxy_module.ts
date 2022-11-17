import "hardhat-deploy"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { deployAndSetUpCustomModule } from "@gnosis.pm/zodiac"

const firstAddress = "0x0000000000000000000000000000000000000001"

const deploy: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  ethers,
  getChainId,
}: HardhatRuntimeEnvironment) {
  console.log("Deploying OZGovernorModule Proxy")
  const { deployer } = await getNamedAccounts()
  const deployerSigner = await ethers.getSigner(deployer)

  const testAvatarDeployment = await deployments.get("TestAvatar")
  const myModuleMastercopyDeployment = await deployments.get("OZGovernorModule")
  const erc20VotesProxyDeployment = await deployments.get("ERC20VotesProxyAddress")

  const chainId = await getChainId()

  const { transaction } = deployAndSetUpCustomModule(
    myModuleMastercopyDeployment.address,
    myModuleMastercopyDeployment.abi,
    {
      values: [
        testAvatarDeployment.address, // owner
        testAvatarDeployment.address, // target
        firstAddress, // multisend
        erc20VotesProxyDeployment.address, // token
        "OZGovernorModule proxy", // name
        1, // votingDelay
        1, // votingPeriod
        1, // proposalThreshold
        1, // quorum
        1, // initialVoteExtension
      ],
      types: [
        "address",
        "address",
        "address",
        "address",
        "string",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint64",
      ],
    },
    ethers.provider as any,
    Number(chainId),
    Date.now().toString(),
  )
  const deploymentTransaction = await deployerSigner.sendTransaction(transaction)
  const receipt = await deploymentTransaction.wait()
  const moduleProxyAddress = receipt.logs[1].address
  console.log("OZGovernorModule minimal proxy deployed to:", moduleProxyAddress)

  // Enable OZGovernorModule as a module on the Safe to give it access to the safe's execTransactionFromModule() function
  const testAvatarContract = await ethers.getContractAt("TestAvatar", testAvatarDeployment.address, deployerSigner)
  const currentActiveModule = await testAvatarContract.module()
  if (currentActiveModule !== moduleProxyAddress) {
    const tx = await testAvatarContract.enableModule(moduleProxyAddress)
    tx.wait()
    console.log("OZGovernorModule proxy enabled on the TestAvatar")
  } else {
    console.log("OZGovernorModule proxy already enabled on the TestAvatar")
  }
}

deploy.tags = ["moduleProxy"]
deploy.dependencies = ["testAvatar", "moduleMastercopy", "erc20VotesProxy"]

export default deploy
