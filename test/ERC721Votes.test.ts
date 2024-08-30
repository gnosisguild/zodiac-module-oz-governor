import { expect } from "chai"
import { ethers } from "hardhat"

const setup = async () => {
  // const { tester } = await getNamedAccounts()
  // const testSigner = await ethers.getSigner(tester)
  const [wallet] = await ethers.getSigners()
  const ERC721Votes = await ethers.getContractFactory("ERC721Votes")
  const paramTypes = ["address", "string", "string"]
  const params = {
    owner: wallet.address,
    name: "Token",
    symbol: "TKN",
  }
  const erc721Token = await ERC721Votes.deploy(params.owner, params.name, params.symbol)
  await erc721Token.waitForDeployment()
  const ModuleProxyFactory = await ethers.getContractFactory("ModuleProxyFactory")
  const moduleProxyFactory = await ModuleProxyFactory.deploy()
  await moduleProxyFactory.waitForDeployment()
  return {
    wallet,
    erc721Token,
    params,
    paramTypes,
    moduleProxyFactory,
  }
}

describe("ERC721Votes", function () {
  describe("constructor", function () {
    it("Successfully deploys contract and sets variables", async function () {
      const { erc721Token, params } = await setup()
      expect(await erc721Token.owner()).to.equal(params.owner)
      expect(await erc721Token.name()).to.equal(params.name)
      expect(await erc721Token.symbol()).to.equal(params.symbol)
    })
  })
  describe("setUp()", function () {
    it("Initializes a proxy deployment", async function () {
      const { erc721Token, params, paramTypes, moduleProxyFactory } = await setup()
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc721Token.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const tx = await moduleProxyFactory.deployModule(await erc721Token.getAddress(), initParams, 0)
      const receipt = await tx.wait()
      const event = receipt.logs.find((log: { topics: ReadonlyArray<string>; data: string }) => {
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

      const moduleProxy = await ethers.getContractAt("ERC721Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
    })

    it("Should fail if setup is called more than once", async function () {
      const { erc721Token, params, paramTypes, moduleProxyFactory } = await setup()
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc721Token.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const tx = await moduleProxyFactory.deployModule(await erc721Token.getAddress(), initParams, 0)
      const receipt = await tx.wait()
      const event = receipt.logs.find((log: { topics: ReadonlyArray<string>; data: string }) => {
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

      const moduleProxy = await ethers.getContractAt("ERC721Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
      expect(moduleProxy.setUp(initParams)).to.be.revertedWith("Initializable: contract is already initialized")
    })
  })
  describe("mint()", function () {
    it("Should mint correct amount of tokens to correct address", async function () {
      const { erc721Token, wallet } = await setup()
      await erc721Token.safeMint(wallet.address)
      expect(await erc721Token.balanceOf(wallet.address)).to.equal(1)
    })
  })
  describe("burn()", function () {
    it("Should burn correct amount of tokens", async function () {
      const { erc721Token, wallet } = await setup()
      await erc721Token.safeMint(wallet.address)
      await erc721Token.burn(0)
      expect(await erc721Token.balanceOf(wallet.address)).to.equal(0)
    })
  })
  describe("pause()", function () {
    it("Should set paused() to true", async function () {
      const { erc721Token } = await setup()
      await erc721Token.pause()
      expect(await erc721Token.paused()).to.equal(true)
    })
  })
  describe("unpause()", function () {
    it("Should set paused() to false", async function () {
      const { erc721Token } = await setup()
      await erc721Token.pause()
      await erc721Token.unpause()
      expect(await erc721Token.paused()).to.equal(false)
    })
  })
  describe("supportsInterface()", function () {
    it("Returns true for supported interfaces.", async function () {
      const { erc721Token } = await setup()
      expect(await erc721Token.supportsInterface("0x01ffc9a7")).to.equal(true)
      expect(await erc721Token.supportsInterface("0x80ac58cd")).to.equal(true)
      expect(await erc721Token.supportsInterface("0x5b5e139f")).to.equal(true)
    })
    it("Returns false for unsupported interfaces.", async function () {
      const { erc721Token } = await setup()
      expect(await erc721Token.supportsInterface("0xdeadbeef")).to.equal(false)
    })
  })
})
