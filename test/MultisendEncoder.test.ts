import { expect } from "chai"
import { PopulatedTransaction } from "ethers"
import hre, { ethers } from "hardhat"
const AddressOne = "0x0000000000000000000000000000000000000001"

const setup = async () => {
  // const { tester } = await getNamedAccounts()
  // const testSigner = await ethers.getSigner(tester)
  const [wallet] = await ethers.getSigners()
  const Avatar = await ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()
  const Multisend = await ethers.getContractFactory("MultiSend")
  const multisend = await Multisend.deploy()
  const MultisendEncoder = await ethers.getContractFactory("MultisendEncoder")
  const multisendEncoder = await MultisendEncoder.deploy()
  const TestMultisendEncoder = await ethers.getContractFactory("TestMultisendEncoder", {
    libraries: {
      MultisendEncoder: multisendEncoder.address,
    },
  })
  const testMultisendEncoder = await TestMultisendEncoder.deploy()
  const params = {
    to: AddressOne,
    value: 0,
    calldata: "0xdeadbeef",
    operation: 0,
  }

  return {
    avatar,
    multisend,
    multisendEncoder,
    wallet,
    testMultisendEncoder,
    params,
  }
}

describe("MultsendEncoder", function () {
  describe("encodeMultisend()", function () {
    it("Should encode provided transactions as a multisend call to the correct multisend address", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      const encodedParams = await ethers.utils.solidityPack(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [params.operation, params.to, params.value, params.calldata.length / 2 - 1, params.calldata],
      )
      const encodedParamsArray = await ethers.utils.solidityPack(["bytes", "bytes"], [encodedParams, encodedParams])
      const encodedMutlisendCall = await multisend.populateTransaction.multiSend(encodedParamsArray)
      const [to, value, calldata, operation] = await testMultisendEncoder.encodeMultisend(
        multisend.address,
        [params.to, params.to],
        [params.value, params.value],
        [params.calldata, params.calldata],
      )
      expect(to).to.equal(multisend.address)
      expect(value).to.equal(0)
      expect(calldata).to.equal(encodedMutlisendCall.data)
      expect(operation).to.equal(1)
    })
    it("Should not encode as a multisend if only one transaction is provided", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      const [to, value, calldata, operation] = await testMultisendEncoder.encodeMultisend(
        multisend.address,
        [params.to],
        [params.value],
        [params.calldata],
      )
      expect(to).to.equal(AddressOne)
      expect(value).to.equal(0)
      expect(calldata).to.equal("0xdeadbeef")
      expect(operation).to.equal(0)
    })
    it("Should revert with NoTransactions() if to is length 0", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      await expect(
        testMultisendEncoder.encodeMultisend(multisend.address, [], [params.value], [params.calldata]),
      ).to.be.revertedWith("NoTransactions()")
    })
    it("Should revert with UnequalArraysLengths() if provided arrays are unequal lengths", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      await expect(
        testMultisendEncoder.encodeMultisend(
          multisend.address,
          [params.to, params.to],
          [params.value],
          [params.calldata],
        ),
      ).to.be.revertedWith("UnequalArraysLengths()")
      await expect(
        testMultisendEncoder.encodeMultisend(
          multisend.address,
          [params.to],
          [params.value, params.value],
          [params.calldata],
        ),
      ).to.be.revertedWith("UnequalArraysLengths()")
      await expect(
        testMultisendEncoder.encodeMultisend(
          multisend.address,
          [params.to],
          [params.value],
          [params.calldata, params.calldata],
        ),
      ).to.be.revertedWith("UnequalArraysLengths()")
    })
  })
})
