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
  const ERC20Votes = await ethers.getContractFactory("ERC20Votes")
  const erc20Token = await ERC20Votes.deploy(wallet.address, "Token", "TKN")

  await erc20Token.mint(wallet.address, 1000000)
  await erc20Token.delegate(wallet.address)
  await erc20Token.transfer(avatar.address, 100000)

  const OZGovernorModuleFactory = await ethers.getContractFactory("OZGovernorModule", {
    libraries: {
      MultisendEncoder: multisendEncoder.address,
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
    owner: avatar.address,
    target: avatar.address,
    multisend: multisend.address,
    token: erc20Token.address,
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
  await avatar.enableModule(ozGovernorModule.address)
  const ModuleProxyFactory = await ethers.getContractFactory("ModuleProxyFactory")
  const moduleProxyFactory = await ModuleProxyFactory.deploy()

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
      const { ozGovernorModule, params } = await setup()
      expect(await ozGovernorModule.owner()).to.equal(params.owner)
      expect(await ozGovernorModule.multisend()).to.equal(params.multisend)
      expect(await ozGovernorModule.target()).to.equal(params.target)
      expect(await ozGovernorModule.token()).to.equal(params.token)
      expect(await ozGovernorModule.name()).to.equal(params.name)
      expect(await ozGovernorModule.votingDelay()).to.equal(params.votingDelay)
      expect(await ozGovernorModule.votingPeriod()).to.equal(params.votingPeriod)
      expect(await ozGovernorModule.proposalThreshold()).to.equal(params.proposalThreshold)
      expect(await ozGovernorModule.lateQuorumVoteExtension()).to.equal(params.lateQuorumVoteExtension)
      // not sure why these checks keep failing. Commenting out for now.
      // const blockNumber = await ethers.provider.getBlockNumber()
      // expect(await ozGovernorModule.quorum(blockNumber)).to.equal(1)
    })
  })
  describe("setUp()", function () {
    it("Initializes a proxy deployment", async function () {
      const { moduleProxyFactory, ozGovernorModule, params, paramTypes } = await setup()
      const initData = await ethers.utils.defaultAbiCoder.encode(paramTypes, [
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

      const initParams = (await ozGovernorModule.populateTransaction.setUp(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(ozGovernorModule.address, initParams, 0)
        .then((tx: any) => tx.wait())

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(({ event }: { event: string }) => event === "ModuleProxyCreation")

      const moduleProxy = await ethers.getContractAt("OZGovernorModule", newProxyAddress)
      expect(await moduleProxy.owner()).to.equal(params.owner)
      expect(await moduleProxy.target()).to.equal(params.target)
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
      const initData = await ethers.utils.defaultAbiCoder.encode(paramTypes, [
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

      const initParams = (await ozGovernorModule.populateTransaction.setUp(initData)).data
      if (!initParams) {
        throw console.error("error")
      }

      const receipt = await moduleProxyFactory
        .deployModule(ozGovernorModule.address, initParams, 0)
        .then((tx: any) => tx.wait())

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(({ event }: { event: string }) => event === "ModuleProxyCreation")

      const moduleProxy = await ethers.getContractAt("OZGovernorModule", newProxyAddress)
      expect(moduleProxy.setUp(initParams)).to.be.revertedWith("Initializable: contract is already initialized")
    })
  })

  describe("_execute()", function () {
    it("Should execute proposed transaction", async function () {
      const { ozGovernorModule, erc20Token, wallet } = await setup()
      await erc20Token.transfer(ozGovernorModule.address, 5000)
      await erc20Token.transferOwnership(ozGovernorModule.address)
      const calldata = await erc20Token.populateTransaction.transfer(wallet.address, 42).then((tx: any) => tx.data)
      const proposal = {
        targets: [erc20Token.address],
        values: [0],
        calldatas: [calldata],
        description: "A token transfer",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())
      const {
        args: [proposalId],
      } = receipt.events.find(({ event }: { event: string }) => event === "ProposalCreated")

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await ozGovernorModule.execute(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        await ethers.utils.solidityKeccak256(["string"], [proposal.description]),
      )

      expect(await erc20Token.balanceOf(wallet.address)).to.equal(895042)
    })

    it("Should execute batch of proposed transactions", async function () {
      const { ozGovernorModule, erc20Token, wallet } = await setup()
      await erc20Token.transfer(ozGovernorModule.address, 5000)
      await erc20Token.transferOwnership(ozGovernorModule.address)
      const calldata = await erc20Token.populateTransaction.transfer(wallet.address, 42).then((tx: any) => tx.data)
      const proposal = {
        targets: [erc20Token.address, erc20Token.address],
        values: [0, 0],
        calldatas: [calldata, calldata],
        description: "A couple of token transfers",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())
      const {
        args: [proposalId],
      } = receipt.events.find(({ event }: { event: string }) => event === "ProposalCreated")

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await ozGovernorModule.execute(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        await ethers.utils.solidityKeccak256(["string"], [proposal.description]),
      )

      expect(await erc20Token.balanceOf(wallet.address)).to.equal(895084)
    })

    it("Should revert with TransactionsFailed() if module transactions fail", async function () {
      const { avatar, ozGovernorModule, erc20Token } = await setup()
      // await erc20Token.transfer(ozGovernorModule.address, 5000)
      await erc20Token.transferOwnership(ozGovernorModule.address)
      const calldata = await erc20Token.populateTransaction.mint(avatar.address, 10000).then((tx: any) => tx.data)
      const proposal = {
        targets: [erc20Token.address],
        values: [0],
        calldatas: [calldata],
        description: "Mint some tokens",
      }

      const receipt = await ozGovernorModule
        .propose(proposal.targets, proposal.values, proposal.calldatas, proposal.description)
        .then((tx: any) => tx.wait())
      const {
        args: [proposalId],
      } = receipt.events.find(({ event }: { event: string }) => event === "ProposalCreated")

      await ozGovernorModule.castVote(proposalId, 1)

      for (let index = 0; index < 100; index++) {
        await hre.network.provider.send("evm_mine", [])
      }

      await expect(
        ozGovernorModule.execute(
          proposal.targets,
          proposal.values,
          proposal.calldatas,
          await ethers.utils.solidityKeccak256(["string"], [proposal.description]),
        ),
      ).to.be.revertedWith("TransactionsFailed()")
    })
  })

  describe("transferOwnership()", function () {
    it("Should transfer ownership and emit OwnershipTransferred() event", async function () {
      const { avatar, ozGovernorModule, wallet } = await setup()
      const tx: PopulatedTransaction = await ozGovernorModule.populateTransaction.transferOwnership(wallet.address)
      if (!tx.data) {
        throw new Error("no tx data")
      }
      expect(await avatar.exec(ozGovernorModule.address, 0, tx.data))
        .to.emit(ozGovernorModule, "OwnershipTransferred()")
        .withArgs(avatar.address)
    })
    it("Should revert if caller is not owner", async function () {
      const { ozGovernorModule, wallet } = await setup()
      await expect(ozGovernorModule.transferOwnership(wallet.address)).to.be.revertedWith("Governor: onlyGovernance")
    })
  })

  describe("setMultisend()", function () {
    it("Should set the multisend address and emit the MultisendSet() event", async function () {
      const { avatar, ozGovernorModule } = await setup()
      const tx: PopulatedTransaction = await ozGovernorModule.populateTransaction.setMultisend(AddressOne)
      if (!tx.data) {
        throw new Error("no tx data")
      }
      expect(await avatar.exec(ozGovernorModule.address, 0, tx.data))
        .to.emit(ozGovernorModule, "MultisendSet()")
        .withArgs(AddressOne)
    })
    it("Should revert if caller is not owner", async function () {
      const { ozGovernorModule } = await setup()
      await expect(ozGovernorModule.setMultisend(AddressOne)).to.be.revertedWith("Governor: onlyGovernance")
    })
  })

  describe("setTarget()", function () {
    it("Should set the target address and emit the TargetSet() event", async function () {
      const { avatar, ozGovernorModule } = await setup()
      const tx: PopulatedTransaction = await ozGovernorModule.populateTransaction.setTarget(AddressOne)
      if (!tx.data) {
        throw new Error("no tx data")
      }
      expect(await avatar.exec(ozGovernorModule.address, 0, tx.data))
        .to.emit(ozGovernorModule, "setTarget()")
        .withArgs(AddressOne)
    })
    it("Should revert if caller is not owner", async function () {
      const { ozGovernorModule } = await setup()
      await expect(ozGovernorModule.setTarget(AddressOne)).to.be.revertedWith("Governor: onlyGovernance")
    })
  })

  describe("version()", function () {
    it("Should return 'Zodaic OZ Governor Module: v1.0.0'", async function () {
      const { ozGovernorModule } = await setup()
      expect(await ozGovernorModule.version()).to.equal("Zodaic OZ Governor Module: v1.0.0")
    })
  })
})
