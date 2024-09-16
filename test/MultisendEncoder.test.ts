import { assert, expect } from "chai"
import hre from "hardhat"
const AddressOne = "0x0000000000000000000000000000000000000001"

const setup = async () => {
  const [wallet] = await hre.ethers.getSigners()
  const Avatar = await hre.ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()
  await avatar.waitForDeployment()
  const Multisend = await hre.ethers.getContractFactory("MultiSend")
  const multisend = await Multisend.deploy()
  await multisend.waitForDeployment()
  const MultisendEncoder = await hre.ethers.getContractFactory("MultisendEncoder")
  const multisendEncoder = await MultisendEncoder.deploy()
  await multisendEncoder.waitForDeployment()
  const TestMultisendEncoder = await hre.ethers.getContractFactory("TestMultisendEncoder", {
    libraries: {
      MultisendEncoder: await multisendEncoder.getAddress(),
    },
  })
  const testMultisendEncoder = await TestMultisendEncoder.deploy()
  await testMultisendEncoder.waitForDeployment()
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
      const encodedParams = hre.ethers.solidityPacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [params.operation, params.to, params.value, params.calldata.length / 2 - 1, params.calldata],
      )
      const encodedParamsArray = hre.ethers.solidityPacked(["bytes", "bytes"], [encodedParams, encodedParams])

      const encodedMutlisendCall = await multisend.multiSend.populateTransaction(encodedParamsArray)
      console.log("multisend", await multisend.getAddress())
      const [to, value, calldata, operation] = await testMultisendEncoder.encodeMultisend(
        await multisend.getAddress(),
        [params.to, params.to],
        [params.value, params.value],
        [params.calldata, params.calldata],
      )
      expect(to).to.equal(await multisend.getAddress())
      expect(Number(value)).to.equal(0)
      expect(calldata).to.equal(encodedMutlisendCall.data)
      expect(Number(operation)).to.equal(1)
    })
    it("Should not encode as a multisend if only one transaction is provided", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      const [to, value, calldata, operation] = await testMultisendEncoder.encodeMultisend(
        await multisend.getAddress(),
        [params.to],
        [params.value],
        [params.calldata],
      )
      expect(to).to.equal(AddressOne)
      expect(Number(value)).to.equal(0)
      expect(calldata).to.equal("0xdeadbeef")
      expect(Number(operation)).to.equal(0)
    })
    it("Should revert with NoTransactions() if to is length 0", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      try {
        await testMultisendEncoder.encodeMultisend(await multisend.getAddress(), [], [params.value], [params.calldata])
        assert.fail("Expected transaction to revert with custom error 'NoTransactions()'")
      } catch (error: any) {
        assert(error.message.includes("NoTransactions"), `Unexpected error: ${error.message}`)
      }
    })
    it("Should revert with UnequalArraysLengths() if provided arrays are unequal lengths", async function () {
      const { multisend, testMultisendEncoder, params } = await setup()
      const multisendAddress = await multisend.getAddress()

      const testCases = [
        {
          targets: [params.to, params.to],
          values: [params.value],
          calldatas: [params.calldata],
        },
        {
          targets: [params.to],
          values: [params.value, params.value],
          calldatas: [params.calldata],
        },
        {
          targets: [params.to],
          values: [params.value],
          calldatas: [params.calldata, params.calldata],
        },
      ]

      for (const { targets, values, calldatas } of testCases) {
        try {
          await testMultisendEncoder.encodeMultisend(multisendAddress, targets, values, calldatas)
          assert.fail("Expected transaction to revert with custom error 'UnequalArraysLengths()'")
        } catch (error: any) {
          assert(
            error.message.includes("UnequalArraysLengths"),
            `Expected 'UnequalArraysLengths' but got '${error.message}'`,
          )
        }
      }
    })
  })
})
