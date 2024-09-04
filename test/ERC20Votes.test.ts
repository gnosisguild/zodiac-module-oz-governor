import { expect } from "chai"
import { ethers } from "hardhat"

const setup = async () => {
  const [wallet] = await ethers.getSigners()
  const ERC20Votes = await ethers.getContractFactory("ERC20Votes")
  const paramTypes = ["address", "string", "string"]
  const params = {
    owner: wallet.address,
    name: "Token",
    symbol: "TKN",
  }
  const erc20Token = await ERC20Votes.deploy(params.owner, params.name, params.symbol)
  await erc20Token.waitForDeployment()
  const ModuleProxyFactory = await ethers.getContractFactory("ModuleProxyFactory")
  const moduleProxyFactory = await ModuleProxyFactory.deploy()
  await moduleProxyFactory.waitForDeployment()
  return {
    wallet,
    erc20Token,
    params,
    paramTypes,
    moduleProxyFactory,
  }
}

describe("ERC20Votes", function () {
  describe("constructor", function () {
    it("Successfully deploys contract and sets variables", async function () {
      const { erc20Token, params } = await setup()
      expect(await erc20Token.owner()).to.equal(params.owner)
      expect(await erc20Token.name()).to.equal(params.name)
      expect(await erc20Token.symbol()).to.equal(params.symbol)
    })
  })
  describe("setUp()", function () {
    it("Initializes a proxy deployment", async function () {
      const { erc20Token, params, paramTypes, moduleProxyFactory } = await setup()
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc20Token.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const tx = await moduleProxyFactory.deployModule(await erc20Token.getAddress(), initParams, 0)
      const receipt = await tx.wait()
      const event = receipt?.logs.find((log: { topics: ReadonlyArray<string>; data: string }) => {
        try {
          const parsedLog = moduleProxyFactory.interface.parseLog(log)
          return parsedLog?.name === "ModuleProxyCreation"
        } catch (e) {
          return false
        }
      })
      if (!event) {
        throw new Error("ModuleProxyCreation event not found")
      }
      const [newProxyAddress] = event.args || []
      const moduleProxy = await ethers.getContractAt("ERC20Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
    })

    it("Should fail if setup is called more than once", async function () {
      const { erc20Token, params, paramTypes, moduleProxyFactory } = await setup()
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc20Token.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const tx = await moduleProxyFactory.deployModule(await erc20Token.getAddress(), initParams, 0)
      const receipt = await tx.wait()

      // retrieve new address from event
      const event = receipt?.logs.find((log: { topics: ReadonlyArray<string>; data: string }) => {
        try {
          const parsedLog = moduleProxyFactory.interface.parseLog(log)
          return parsedLog?.name === "ModuleProxyCreation"
        } catch (e) {
          return false
        }
      })
      if (!event) {
        throw new Error("ModuleProxyCreation event not found")
      }
      const [newProxyAddress] = event.args || []
      const moduleProxy = await ethers.getContractAt("ERC20Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
      expect(moduleProxy.setUp(initParams)).to.be.revertedWith("Initializable: contract is already initialized")
    })
  })
  describe("mint()", function () {
    it("Should mint correct amount of tokens to correct address", async function () {
      const { erc20Token, wallet } = await setup()
      await erc20Token.mint(wallet.address, 100)
      expect(await erc20Token.balanceOf(wallet.address)).to.equal(100)
    })
  })
  describe("burn()", function () {
    it("Should burn correct amount of tokens", async function () {
      const { erc20Token, wallet } = await setup()
      await erc20Token.mint(wallet.address, 100)
      await erc20Token.burn(50)
      expect(await erc20Token.balanceOf(wallet.address)).to.equal(50)
    })
  })
  describe("pause()", function () {
    it("Should set paused() to true", async function () {
      const { erc20Token } = await setup()
      await erc20Token.pause()
      expect(await erc20Token.paused()).to.equal(true)
    })
  })
  describe("unpause()", function () {
    it("Should set paused() to false", async function () {
      const { erc20Token } = await setup()
      await erc20Token.pause()
      await erc20Token.unpause()
      expect(await erc20Token.paused()).to.equal(false)
    })
  })
})
