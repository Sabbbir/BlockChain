const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bank", function () {
  let Bank;
  let bank;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    Bank = await ethers.getContractFactory("Bank");
    [owner, addr1, addr2] = await ethers.getSigners();
    bank = await Bank.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await bank.admin()).to.equal(owner.address);
    });
  });

  describe("Customer Registration", function () {
    it("Should register a new customer", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      const customer = await bank.customers(addr1.address);
      expect(customer.name).to.equal("Alice");
      expect(customer.isRegistered).to.be.true;
    });

    it("Should fail if already registered", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      await expect(bank.connect(addr1).registerCustomer("Bob")).to.be.revertedWith(
        "Customer already registered"
      );
    });
  });

  describe("Deposits", function () {
    it("Should deposit funds", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      await bank.connect(addr1).deposit({ value: ethers.parseEther("1.0") });
      const balance = await bank.connect(addr1).getBalance();
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should fail if not registered", async function () {
      await expect(
        bank.connect(addr1).deposit({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Customer not registered");
    });
  });

  describe("Withdrawals", function () {
    it("Should withdraw funds", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      await bank.connect(addr1).deposit({ value: ethers.parseEther("2.0") });
      await bank.connect(addr1).withdraw(ethers.parseEther("1.0"));
      const balance = await bank.connect(addr1).getBalance();
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should fail if insufficient balance", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      await bank.connect(addr1).deposit({ value: ethers.parseEther("1.0") });
      await expect(
        bank.connect(addr1).withdraw(ethers.parseEther("2.0"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Transfers", function () {
    it("Should transfer funds to another registered customer", async function () {
      await bank.connect(addr1).registerCustomer("Alice");
      await bank.connect(addr2).registerCustomer("Bob");

      await bank.connect(addr1).deposit({ value: ethers.parseEther("2.0") });
      await bank.connect(addr1).transfer(addr2.address, ethers.parseEther("1.0"));

      expect(await bank.connect(addr1).getBalance()).to.equal(ethers.parseEther("1.0"));
      expect(await bank.connect(addr2).getBalance()).to.equal(ethers.parseEther("1.0"));
    });
  });
});
