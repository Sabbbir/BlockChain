const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Local Hardhat Default

const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function registerCustomer(string memory _name)",
  "function deposit() payable",
  "function withdraw(uint256 _amount)",
  "function transfer(address _to, uint256 _amount)",
  "function getBalance() view returns (uint256)",
  "function getMyTransactions() view returns (tuple(uint256 id, address user, uint8 txType, uint256 amount, uint256 timestamp, address relatedParty)[])",
  "function customers(address) view returns (string name, bool isRegistered, uint256 balance)",
  // Admin Functions
  "function getAllCustomers() view returns (address[])",
  "function getCustomerDetails(address _customer) view returns (string memory, bool, uint256)",
  "function getContractBalance() view returns (uint256)",
  "function getAllTransactions() view returns (tuple(uint256 id, address user, uint8 txType, uint256 amount, uint256 timestamp, address relatedParty)[])"
];
