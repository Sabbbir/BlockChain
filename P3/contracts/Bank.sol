// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Bank {
    address public admin;

    struct Customer {
        string name;
        bool isRegistered;
        uint256 balance;
    }

    enum TransactionType { Deposit, Withdrawal, TransferIn, TransferOut }

    struct Transaction {
        uint256 id;
        address user;
        TransactionType txType;
        uint256 amount;
        uint256 timestamp;
        address relatedParty; // For transfers
    }

    mapping(address => Customer) public customers;
    Transaction[] public transactions;
    uint256 public nextTxId;

    address[] public customerAddresses;

    event CustomerRegistered(address indexed user, string name);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyRegistered() {
        require(customers[msg.sender].isRegistered, "Customer not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerCustomer(string memory _name) public {
        require(!customers[msg.sender].isRegistered, "Customer already registered");
        customers[msg.sender] = Customer(_name, true, 0);
        customerAddresses.push(msg.sender);
        emit CustomerRegistered(msg.sender, _name);
    }

    function deposit() public payable onlyRegistered {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        customers[msg.sender].balance += msg.value;
        
        transactions.push(Transaction({
            id: nextTxId++,
            user: msg.sender,
            txType: TransactionType.Deposit,
            amount: msg.value,
            timestamp: block.timestamp,
            relatedParty: address(0)
        }));
        
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) public onlyRegistered {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(customers[msg.sender].balance >= _amount, "Insufficient balance");
        
        customers[msg.sender].balance -= _amount;
        
        transactions.push(Transaction({
            id: nextTxId++,
            user: msg.sender,
            txType: TransactionType.Withdrawal,
            amount: _amount,
            timestamp: block.timestamp,
            relatedParty: address(0)
        }));
        
        payable(msg.sender).transfer(_amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function transfer(address _to, uint256 _amount) public onlyRegistered {
        require(_amount > 0, "Transfer amount must be greater than 0");
        require(customers[msg.sender].balance >= _amount, "Insufficient balance");
        require(customers[_to].isRegistered, "Recipient is not registered");
        require(_to != msg.sender, "Cannot transfer to yourself");

        customers[msg.sender].balance -= _amount;
        customers[_to].balance += _amount;

        // Record Transfer Out for sender
        transactions.push(Transaction({
            id: nextTxId++,
            user: msg.sender,
            txType: TransactionType.TransferOut,
            amount: _amount,
            timestamp: block.timestamp,
            relatedParty: _to
        }));

        // Record Transfer In for recipient
        transactions.push(Transaction({
            id: nextTxId++,
            user: _to,
            txType: TransactionType.TransferIn,
            amount: _amount,
            timestamp: block.timestamp,
            relatedParty: msg.sender
        }));

        emit Transferred(msg.sender, _to, _amount);
    }

    function getBalance() public view onlyRegistered returns (uint256) {
        return customers[msg.sender].balance;
    }

    function getMyTransactions() public view onlyRegistered returns (Transaction[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].user == msg.sender) {
                count++;
            }
        }

        Transaction[] memory myTxs = new Transaction[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].user == msg.sender) {
                myTxs[index] = transactions[i];
                index++;
            }
        }
        return myTxs;
    }

    // --- Admin Functions ---

    function getAllCustomers() public view onlyAdmin returns (address[] memory) {
        return customerAddresses;
    }
    
    function getCustomerDetails(address _customer) public view onlyAdmin returns (string memory, bool, uint256) {
        Customer memory c = customers[_customer];
        return (c.name, c.isRegistered, c.balance);
    }

    function getAllTransactions() public view onlyAdmin returns (Transaction[] memory) {
        return transactions;
    }
    
    function getContractBalance() public view onlyAdmin returns (uint256) {
        return address(this).balance;
    }
}
