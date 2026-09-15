const { ethers } = require("hardhat");
const ABI = [
  "function admin() view returns (address)",
  "function getAllCustomers() view returns (address[])",
  "function getContractBalance() view returns (uint256)",
  "function getAllTransactions() view returns (tuple(uint256 id, address user, uint8 txType, uint256 amount, uint256 timestamp, address relatedParty)[])"
];
async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contract = new ethers.Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", ABI, provider);
  const admin = await contract.admin();
  console.log("Admin:", admin);
  
  const signers = await ethers.getSigners();
  const adminSigner = signers[0];
  const contractWithSigner = contract.connect(adminSigner);
  
  const customers = await contractWithSigner.getAllCustomers();
  console.log("Customers:", customers.length);
  const balance = await contractWithSigner.getContractBalance();
  console.log("Balance:", balance.toString());
  const txs = await contractWithSigner.getAllTransactions();
  console.log("Transactions:", txs.length);
}
main().catch(console.error);
