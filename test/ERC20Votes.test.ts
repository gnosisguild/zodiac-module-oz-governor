import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { deployFactories, deployProxy } from "@gnosis-guild/zodiac-core"
import createAdapter from "./createEIP1193"

const saltNonce = "0xfa"

const setup = async () => {
  const [wallet, deployer] = await ethers.getSigners()
  const eip1193Provider = createAdapter({
    provider: hre.network.provider,
    signer: deployer,
  })

  const ERC20Votes = await ethers.getContractFactory("ERC20Votes")
  const paramTypes = ["address", "string", "string"]
  const params = {
    owner: wallet.address,
    name: "Token",
    symbol: "TKN",
  }
  const erc20Token = await ERC20Votes.deploy(params.owner, params.name, params.symbol)
  await erc20Token.waitForDeployment()
  await deployFactories({ provider: eip1193Provider })
  return {
    wallet,
    erc20Token,
    params,
    paramTypes,
    eip1193Provider,
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
      const { erc20Token, params, paramTypes, eip1193Provider } = await setup()
      const { address: newProxyAddress } = await deployProxy({
        mastercopy: await erc20Token.getAddress(),
        setupArgs: {
          types: paramTypes,
          values: [params.owner, params.name, params.symbol],
        },
        saltNonce,
        provider: eip1193Provider,
      })
      const moduleProxy = await ethers.getContractAt("ERC20Votes", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.symbol()).to.equal(params.symbol)
    })

    it("Should fail if setup is called more than once", async function () {
      const { erc20Token, params, paramTypes, eip1193Provider } = await setup()
      const initData = ethers.AbiCoder.defaultAbiCoder().encode(paramTypes, [params.owner, params.name, params.symbol])

      const initParams = (await erc20Token.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const { address: newProxyAddress } = await deployProxy({
        mastercopy: await erc20Token.getAddress(),
        setupArgs: {
          types: paramTypes,
          values: [params.owner, params.name, params.symbol],
        },
        saltNonce,
        provider: eip1193Provider,
      })
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
