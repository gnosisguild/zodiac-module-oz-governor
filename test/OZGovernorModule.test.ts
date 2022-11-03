import { expect } from "chai"
import { ethers, deployments, getNamedAccounts } from "hardhat"

const AddressZero = "0x0000000000000000000000000000000000000000"
const AddressOne = "0x0000000000000000000000000000000000000001"

const setup = async () => {
  await deployments.fixture(["OZGovernorModule"])
  const { tester } = await getNamedAccounts()
  const testSigner = await ethers.getSigner(tester)
  const Avatar = await ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()
  const MultisendEncoder = await ethers.getContractFactory("MultisendEncoder")
  const multisendEncoder = await MultisendEncoder.deploy()
  const OZGovernorModuleFactory = await ethers.getContractFactory("OZGovernorModule", {
    libraries: {
      MultisendEncoder: multisendEncoder.address,
    },
  })
  const ozGovernorModule = await OZGovernorModuleFactory.deploy(
    testSigner.address,
    avatar.address,
    avatar.address,
    AddressOne,
    "Test Governor",
    1,
    60,
    0,
    1,
  )

  return { avatar, ozGovernorModule, testSigner }
}

describe("OZGovernorModule", function () {
  describe("Constructor", function () {
    it("Successfully deploys contract and sets variables", async function () {
      const { avatar, ozGovernorModule, testSigner } = await setup()
      expect(await ozGovernorModule.owner()).to.equal(testSigner.address)
      expect(await ozGovernorModule.avatar()).to.equal(avatar.address)
      expect(await ozGovernorModule.target()).to.equal(avatar.address)
      expect(await ozGovernorModule.token()).to.equal(AddressOne)
      expect(await ozGovernorModule.name()).to.equal("Test Governor")
      expect(await ozGovernorModule.votingDelay()).to.equal(1)
      expect(await ozGovernorModule.votingPeriod()).to.equal(60)
      expect(await ozGovernorModule.proposalThreshold()).to.equal(0)
      const blockNumber = await ethers.provider.getBlockNumber()
      expect(await ozGovernorModule.quorum(blockNumber)).to.equal(1)
    })
  })
})
