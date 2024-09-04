import { expect } from "chai"
import hre, { ethers } from "hardhat"
const AddressOne = "0x0000000000000000000000000000000000000001"

const abiCoder = ethers.AbiCoder.defaultAbiCoder()

const setup = async () => {
  // const { tester } = await getNamedAccounts()
  // const testSigner = await ethers.getSigner(tester)
  const [wallet] = await ethers.getSigners()
  const Avatar = await ethers.getContractFactory("TestAvatar")
  const avatar = await Avatar.deploy()

  const Multisend = await ethers.getContractFactory("MultiSend")
  const multisend = await Multisend.deploy()

  // TODO: not sure why, but this line is printing "[Warning] Invalid Fragment" in the console
  const MultisendEncoder = await ethers.getContractFactory("MultisendEncoder")

  const multisendEncoder = await MultisendEncoder.deploy()
  const ERC20Votes = await ethers.getContractFactory("ERC20Votes")
  const erc20Token = await ERC20Votes.deploy(wallet.address, "Token", "TKN")

  await erc20Token.mint(wallet.address, 1000000)
  await erc20Token.delegate(wallet.address)
  await erc20Token.transfer(await avatar.getAddress(), 100000)

  const OZGovernorModuleFactory = await ethers.getContractFactory("OZGovernorModule", {
    libraries: {
      MultisendEncoder: await multisendEncoder.getAddress(),
    },
  })
  const paramTypes = [
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
  ]
  const params = {
    owner: await avatar.getAddress(),
    target: await avatar.getAddress(),
    multisend: await multisend.getAddress(),
    token: await erc20Token.getAddress(),
    name: "Test Governor",
    votingDelay: 0,
    votingPeriod: 60,
    proposalThreshold: 0,
    quorum: 1,
    lateQuorumVoteExtension: 10,
  }

  const ozGovernorModule = await OZGovernorModuleFactory.deploy(
    params.owner,
    params.target,
    params.multisend,
    params.token,
    params.name,
    params.votingDelay,
    params.votingPeriod,
    params.proposalThreshold,
    params.quorum,
    params.lateQuorumVoteExtension,
  )
  await ozGovernorModule.waitForDeployment()
  await avatar.enableModule(await ozGovernorModule.getAddress())
  const ModuleProxyFactory = await ethers.getContractFactory("ModuleProxyFactory")
  const moduleProxyFactory = await ModuleProxyFactory.deploy()
  await moduleProxyFactory.waitForDeployment()

  return {
    avatar,
    multisend,
    moduleProxyFactory,
    ozGovernorModule,
    params,
    paramTypes,
    wallet,
    erc20Token,
    multisendEncoder,
  }
}

describe("OZGovernorModule", function () {
  describe("constructor", function () {
    it("Successfully deploys contract and sets variables", async function () {
      const { ozGovernorModule, params, wallet } = await setup()
      expect(await ozGovernorModule.owner()).to.equal(params.owner)
      expect(await ozGovernorModule.multisend()).to.equal(params.multisend)
      const functionFragment = ozGovernorModule.interface.getFunction("target")
      const functionSelector = functionFragment.selector
      const result = await wallet.call({
        to: await ozGovernorModule.getAddress(),
        data: functionSelector,
      })
      const decodedResult = ozGovernorModule.interface.decodeFunctionResult("target", result)
      expect(decodedResult[0]).to.equal(params.target)
      expect(await ozGovernorModule.token()).to.equal(params.token)
      expect(await ozGovernorModule.name()).to.equal(params.name)
      expect(await ozGovernorModule.votingDelay()).to.equal(params.votingDelay)
      expect(await ozGovernorModule.votingPeriod()).to.equal(params.votingPeriod)
      expect(await ozGovernorModule.proposalThreshold()).to.equal(params.proposalThreshold)
      expect(await ozGovernorModule.lateQuorumVoteExtension()).to.equal(params.lateQuorumVoteExtension)
      const blockNumber = await ethers.provider.getBlockNumber()
      expect(await ozGovernorModule.quorum(blockNumber - 1)).to.equal(10000)
    })
  })
  describe("setUp()", function () {
    it("Initializes a proxy deployment", async function () {
      const { moduleProxyFactory, ozGovernorModule, params, paramTypes, wallet } = await setup()
      const initData = abiCoder.encode(paramTypes, [
        params.owner,
        params.target,
        params.multisend,
        params.token,
        params.name,
        params.votingDelay,
        params.votingPeriod,
        params.proposalThreshold,
        params.quorum,
        params.lateQuorumVoteExtension,
      ])

      const initParams = (await ozGovernorModule.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(await ozGovernorModule.getAddress(), initParams, 0)
        .then((tx: any) => tx.wait())

      const parsedLogs = receipt.logs.map((log: any) => {
        try {
          return moduleProxyFactory.interface.parseLog(log)
        } catch (error) {
          return null
        }
      })

      const event = parsedLogs.find((log: any) => log && log.name === "ModuleProxyCreation")

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = event

      const moduleProxy = await ethers.getContractAt("OZGovernorModule", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      const functionFragment = ozGovernorModule.interface.getFunction("target")
      const functionSelector = functionFragment.selector
      const result = await wallet.call({
        to: await ozGovernorModule.getAddress(),
        data: functionSelector,
      })
      const decodedResult = ozGovernorModule.interface.decodeFunctionResult("target", result)
      expect(decodedResult[0]).to.equal(params.target)
      expect(await moduleProxy.multisend()).to.equal(params.multisend)
      expect(await moduleProxy.token()).to.equal(params.token)
      expect(await moduleProxy.name()).to.equal(params.name)
      expect(await moduleProxy.votingDelay()).to.equal(params.votingDelay)
      expect(await moduleProxy.votingPeriod()).to.equal(params.votingPeriod)
      expect(await moduleProxy.proposalThreshold()).to.equal(params.proposalThreshold)
      expect(await moduleProxy.lateQuorumVoteExtension()).to.equal(params.lateQuorumVoteExtension)
    })

    it("Should fail if setup is called more than once", async function () {
      const { moduleProxyFactory, ozGovernorModule, params, paramTypes } = await setup()
      const initData = abiCoder.encode(paramTypes, [
        params.owner,
        params.target,
        params.multisend,
        params.token,
        params.name,
        params.votingDelay,
        params.votingPeriod,
        params.proposalThreshold,
        params.quorum,
        params.lateQuorumVoteExtension,
      ])

      const initParams = (await ozGovernorModule.setUp.populateTransaction(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(await ozGovernorModule.getAddress(), initParams, 0)
        .then((tx: any) => tx.wait())

      const parsedLogs = receipt.logs.map((log: any) => {
        try {
          return moduleProxyFactory.interface.parseLog(log)
        } catch (error) {
          return null
        }
      })

      const event = parsedLogs.find((log: any) => log && log.name === "ModuleProxyCreation")

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = event

      const moduleProxy = await ethers.getContractAt("OZGovernorModule", newProxyAddress)
      expect(moduleProxy.setUp(initParams)).to.be.revertedWith("Initializable: contract is already initialized")
    })
  })

  describe("_execute()", function () {
    it("Should execute proposed transaction", async function () {
      const { ozGovernorModule, erc20Token, wallet } = await setup()
      await erc20Token.transfer(await ozGovernorModule.getAddress(), 5000)
      await erc20Token.transferOwnership(await ozGovernorModule.getAddress())
      const calldata = await erc20Token.transfer.populateTransaction(wallet.address, 42).then((tx: any) => tx.data)
      const proposal = {
        targets: [await erc20Token.getAddress()],
        values: [0],
        calldatas: [calldata],
        description: "A token transfer",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())

      const parsedLogs = receipt.logs.map((log: any) => {
        try {
          return ozGovernorModule.interface.parseLog(log)
        } catch (error) {
          return null
        }
      })

      const event = parsedLogs.find((log: any) => log && log.name === "ProposalCreated")

      // retrieve new address from event
      const {
        args: [proposalId],
      } = event

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await ozGovernorModule.execute(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        ethers.solidityPackedKeccak256(["string"], [proposal.description]),
      )

      expect(await erc20Token.balanceOf(wallet.address)).to.equal(895042)
    })

    it("Should execute batch of proposed transactions", async function () {
      const { ozGovernorModule, erc20Token, wallet } = await setup()
      await erc20Token.transfer(await ozGovernorModule.getAddress(), 5000)
      await erc20Token.transferOwnership(await ozGovernorModule.getAddress())
      const calldata = await erc20Token.transfer.populateTransaction(wallet.address, 42).then((tx: any) => tx.data)
      const proposal = {
        targets: [await erc20Token.getAddress(), await erc20Token.getAddress()],
        values: [0, 0],
        calldatas: [calldata, calldata],
        description: "A couple of token transfers",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())

      const parsedLogs = receipt.logs.map((log: any) => {
        try {
          return ozGovernorModule.interface.parseLog(log)
        } catch (error) {
          return null
        }
      })

      const event = parsedLogs.find((log: any) => log && log.name === "ProposalCreated")

      // retrieve new address from event
      const {
        args: [proposalId],
      } = event

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await ozGovernorModule.execute(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        ethers.solidityPackedKeccak256(["string"], [proposal.description]),
      )

      expect(await erc20Token.balanceOf(wallet.address)).to.equal(895084)
    })

    it("Should revert with TransactionsFailed() if module transactions fail", async function () {
      const { avatar, ozGovernorModule, erc20Token } = await setup()
      // await erc20Token.transfer(await ozGovernorModule.getAddress(), 5000)
      await erc20Token.transferOwnership(await ozGovernorModule.getAddress())
      const calldata = await erc20Token.mint
        .populateTransaction(await avatar.getAddress(), 10000)
        .then((tx: any) => tx.data)
      const proposal = {
        targets: [await erc20Token.getAddress()],
        values: [0],
        calldatas: [calldata],
        description: "Mint some tokens",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())

      const parsedLogs = receipt.logs.map((log: any) => {
        try {
          return ozGovernorModule.interface.parseLog(log)
        } catch (error) {
          return null
        }
      })

      const event = parsedLogs.find((log: any) => log && log.name === "ProposalCreated")

      // retrieve new address from event
      const {
        args: [proposalId],
      } = event

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await expect(
        ozGovernorModule.execute(
          proposal.targets,
          proposal.values,
          proposal.calldatas,
          ethers.solidityPackedKeccak256(["string"], [proposal.description]),
        ),
      ).to.be.revertedWithCustomError(ozGovernorModule, "TransactionsFailed()")
    })
  })
})
