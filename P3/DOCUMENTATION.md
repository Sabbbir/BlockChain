# Blockchain-Based Secure Banking Transaction System

## Project Overview

This decentralized application (DApp) implements a secure, robust banking transaction system on an Ethereum-compatible blockchain (developed using Hardhat). The project consists of a Smart Contract backend (Solidity) and a premium, dynamic Vanilla HTML/CSS/JS frontend application integrated with MetaMask via `ethers.js`.

### Key Features
- **Secure Customer Registration**: Only registered users can interact with the banking logic.
- **Deposit & Withdraw**: Fund your account directly from your crypto wallet and withdraw back securely.
- **Transfers**: Seamlessly transfer ETH to other registered users within the network.
- **Immutable Transaction History**: All deposits, withdrawals, and transfers are recorded directly on the blockchain.
- **Admin Dashboard**: System administrators can monitor the total number of registered users and the overall contract balance.
- **Performance Evaluation**: Scripts provided to evaluate smart contract latency, gas costs, throughput, and CPU/Memory usage.

---

## Technical Stack
- **Smart Contract Development**: Solidity, Hardhat
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Web3 Integration**: Ethers.js (v6.7.0)
- **Testing**: Mocha, Chai, Hardhat Network

---

## Step-by-Step Guide: How to Run the Project

### Prerequisites
1. **Node.js**: Ensure Node.js (v16+ recommended) and npm are installed on your machine.
2. **MetaMask Extension**: Install the [MetaMask extension](https://metamask.io/) in your browser (Chrome, Firefox, or Brave).

### 1. Install Project Dependencies
Open your terminal, navigate to the project root directory, and run:
```bash
npm install
```

### 2. Start the Local Blockchain Network
Start a local Hardhat node. This will provide you with 20 pre-funded test accounts.
```bash
npx hardhat node
```
*Note: Keep this terminal window open and running. All transactions will be processed here.*

### 3. Deploy the Smart Contract
Open a **new terminal window** in the project root directory. Deploy the smart contract to the running local network:
```bash
npx hardhat ignition deploy ignition/modules/Bank.js --network localhost
```
*Note the deployed contract address output in the terminal. (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)*

### 4. Configure the Frontend
Open `frontend/config.js` in a text editor.
Ensure that the `CONTRACT_ADDRESS` constant matches the address you received in step 3.
```javascript
const CONTRACT_ADDRESS = "0x...YOUR_CONTRACT_ADDRESS..."; 
```

### 5. Launch the Frontend
You can serve the frontend directory using any local HTTP server. For example:
```bash
# Using Python
python3 -m http.server 3000 -d frontend

# Using Node (if 'serve' is installed globally)
npx serve frontend
```
Open `http://localhost:3000` (or the port specified) in your browser.

### 6. Configure MetaMask for Localhost
- Open MetaMask in your browser.
- Go to Settings > Networks > Add Network (Manually).
- **Network Name**: Localhost 8545
- **New RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 1337 (or 31337 depending on Hardhat config)
- **Currency Symbol**: ETH
- Import one of the test accounts provided by the Hardhat node using its private key.

---

## How to Interact with the System (User Guide)

### Connecting your Wallet
1. On the landing page, click the **"Connect Wallet"** button.
2. MetaMask will prompt you to authorize the connection. Approve it.
3. Your wallet address will appear at the top of the screen.

### Registering an Account
1. If you are a new user, you will be prompted to register.
2. Enter your Full Name in the provided input field.
3. Click **"Register Account"**. Confirm the transaction in MetaMask.
4. Once confirmed, you will be redirected to your User Dashboard.

### Depositing Funds
1. Navigate to the **Dashboard** tab.
2. Under "Deposit Funds", enter the amount in ETH you wish to deposit.
3. Click **"Deposit"** and confirm the transaction via MetaMask.
4. Your account balance will update once the transaction is mined.

### Withdrawing Funds
1. Under "Withdraw Funds", enter the amount in ETH you wish to withdraw.
2. Click **"Withdraw"** and confirm the transaction via MetaMask.
3. The ETH will be sent back to your MetaMask wallet.

### Transferring Funds
1. Navigate to the **Transfer** tab from the sidebar.
2. Enter the recipient's Wallet Address (must be a registered user).
3. Enter the amount in ETH.
4. Click **"Send Transfer"** and confirm in MetaMask.

### Viewing Transaction History
1. Navigate to the **History** tab.
2. You will see a tabular record of all your Deposits, Withdrawals, and Transfers along with amounts and timestamps.

---

## Admin Functionality

The wallet address that deployed the smart contract automatically becomes the **Admin**.
If you connect to the frontend using the Admin wallet:
1. An additional **Admin Panel** tab will appear in the sidebar navigation.
2. In the Admin Panel, you can view the **Total Number of Registered Users**.
3. You can also view the total **Contract Balance** (liquidity held by the bank).
4. Use the "Refresh Stats" button to fetch the latest network data.

---

## Testing & Performance Evaluation

### Automated Tests
The smart contract comes with a comprehensive test suite. To run the tests, execute:
```bash
npx hardhat test
```

### Performance Benchmarks
To evaluate smart contract performance (latency, gas costs):
1. Ensure the local Hardhat node is running (`npx hardhat node`).
2. Run the benchmark script:
```bash
node performance/benchmark.js
```
3. The script will output metrics directly to the terminal and generate a `performance_report.json` file in the root directory.
