# Blockchain-Based Secure Banking Transaction System

This decentralized application (DApp) implements a secure banking transaction system on an Ethereum-compatible blockchain (developed using Hardhat). 

It features secure customer registration, deposits, withdrawals, transfers, an immutable transaction history, and an admin dashboard.

## Features

- **Smart Contract (`contracts/Bank.sol`)**: Handles the core banking logic (Registration, Deposit, Withdraw, Transfer).
- **Frontend (`frontend/`)**: A premium, dynamic Vanilla HTML/CSS/JS frontend application integrated with MetaMask via `ethers.js`.
- **Performance Evaluation (`performance/benchmark.js`)**: A script to evaluate smart contract latency, gas costs, throughput, and CPU/Memory usage.

## Setup Instructions

### 1. Install Dependencies
Run the following in the root directory:
```bash
npm install
```

### 2. Start the Local Blockchain Node
```bash
npx hardhat node
```
This will start a local Hardhat network and print out 20 test accounts with 10000 ETH each.

### 3. Deploy the Smart Contract
Open a **new terminal** (while the node is running) and run:
```bash
npx hardhat ignition deploy ignition/modules/Bank.js --network localhost
```
*Note the deployed contract address.*

### 4. Configure Frontend
Open `frontend/config.js` and ensure that the `CONTRACT_ADDRESS` matches the address where your contract was deployed.

### 5. Run the Frontend
You can serve the frontend directory using any simple HTTP server. For example:
```bash
npx http-server ./frontend -p 5173
```
or 
```bash
python3 -m http.server 3000 -d frontend
```
Open the provided URL in your browser and connect using MetaMask. Make sure your MetaMask is connected to the Localhost 8545 network (Chain ID: 31337).

### 6. Run Tests
To run the automated test suite:
```bash
npx hardhat test
```

### 7. Run Performance Evaluation
Ensure your local node is running, then execute:
```bash
node performance/benchmark.js
```
The script will output the latency and gas metrics directly in the terminal, and save the data to `performance_report.json`.

---

## Troubleshooting: "Cannot Use Old Keys" / Nonce Errors

**Issue:** 
*"When I run the app again, it does not let me use old keys/users."*

**Cause:** 
When you restart the local Hardhat node (`npx hardhat node`), the blockchain state resets completely. However, your MetaMask still remembers the previous transactions (nonces) for those test accounts. When you try to use those same accounts on the fresh node, MetaMask sends the wrong nonce and the transaction fails.

**Solution (How to start new every time):**
1. Open **MetaMask**.
2. Click on the three dots (Account Options) > **Settings**.
3. Go to **Advanced**.
4. Click **"Clear activity tab data"** (or "Reset Account" on older versions).
5. Do this for any account you want to reuse.
6. Now you can register your old keys as new users on the fresh blockchain!

