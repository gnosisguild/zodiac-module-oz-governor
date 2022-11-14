import { expect } from "chai"
import { ethers } from "hardhat"

const setup = async () => {
  // const { tester } = await getNamedAccounts()
  // const testSigner = await ethers.getSigner(tester)
  const [wallet] = await ethers.getSigners()
  const ERC20Votes = await ethers.getContractFactory("ERC20Votes")
  const paramTypes = ["address", "string", "string"]
  const params = {
    owner: wallet.address,
    name: "Token",
    symbol: "TKN",
  }
  const erc20Token = await ERC20Votes.deploy(params.owner, params.name, params.symbol)
  const ModuleProxyFactory = await ethers.getContractFactory("ModuleProxyFactory")
  const moduleProxyFactory = await ModuleProxyFactory.deploy()
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
      const initData = await ethers.utils.defaultAbiCoder.encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc20Token.populateTransaction.setUp(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(erc20Token.address, initParams, 0)
        .then((tx: any) => tx.wait())

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(({ event }: { event: string }) => event === "ModuleProxyCreation")

      const moduleProxy = await ethers.getContractAt("ERC20Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
    })

    it("Should fail if setup is called more than once", async function () {
      const { erc20Token, params, paramTypes, moduleProxyFactory } = await setup()
      const initData = await ethers.utils.defaultAbiCoder.encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc20Token.populateTransaction.setUp(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(erc20Token.address, initParams, 0)
        .then((tx: any) => tx.wait())

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(({ event }: { event: string }) => event === "ModuleProxyCreation")

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
