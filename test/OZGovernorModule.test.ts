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
  const OZGovernorModuleFactory = await ethers.getContractFactory("OZGovernorModule")
  const ozGovernorModule = await OZGovernorModuleFactory.deploy(
    testSigner.address,
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
      const { ozGovernorModule, testSigner } = await setup()
      expect(await ozGovernorModule.owner()).to.equal(testSigner.address)
      expect(await ozGovernorModule.token()).to.equal(AddressOne)
      expect(await ozGovernorModule.name()).to.equal("Test Governor")
      expect(await ozGovernorModule.votingDelay()).to.equal(1)
      expect(await ozGovernorModule.votingPeriod()).to.equal(60)
      expect(await ozGovernorModule.proposalThreshold()).to.equal(0)
    })
  })
})
