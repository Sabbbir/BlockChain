
# 🏥 MedChain — Blockchain-Based Healthcare Data Sharing DApp

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square&logo=solidity)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square&logo=tailwind-css)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)
A production-grade decentralized application for secure, patient-controlled medical record sharing using a **Hybrid Architecture**: Ethereum blockchain for permissions & audit, IPFS for encrypted file storage, and SQLite for user profiles.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ MetaMask │  │ AES-256   │  │ Role-Based       │ │
│  │ Wallet   │  │ Encryption│  │ Dashboards       │ │
│  └────┬─────┘  └─────┬─────┘  └────────────────┘  │
│       │               │                             │
├───────┼───────────────┼─────────────────────────────┤
│       ▼               ▼                             │
│  ┌─────────┐   ┌───────────┐   ┌────────────────┐ │
│  │Ethereum │   │   IPFS    │   │  Express API   │ │
│  │(Sepolia)│   │ (Pinata)  │   │  + SQLite DB   │ │
│  └─────────┘   └───────────┘   └────────────────┘ │
│                                                     │
│  Smart Contracts:                                   │
│  • RoleManager.sol  — RBAC (Admin/Hospital/Doctor/Patient)
│  • MedicalRecord.sol — Record CIDs + Access Control │
│  • AuditLogger.sol  — Immutable event-based audit   │
└─────────────────────────────────────────────────────┘
```

## ✨ Features

- **Patient-Controlled Access**: Patients grant/revoke doctor access via blockchain
- **Client-Side Encryption**: AES-256-GCM — raw medical files never leave the browser
- **Decentralized Storage**: Encrypted files stored on IPFS (via Pinata)
- **Immutable Audit Trail**: Every action logged as blockchain events
- **Role-Based Dashboards**: Dedicated UIs for Patient, Doctor, Hospital, Admin
- **Performance Metrics**: Built-in measurement of gas costs, latency, encryption time
- **Gas Reporting**: Automated gas consumption analysis via `hardhat-gas-reporter`

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (`node --version`)
- **MetaMask** browser extension
- **Git**

### 1. Install Dependencies

```bash
# Root project (Hardhat + backend)
cd P1
npm install

# Frontend (Next.js)
cd frontend
npm install
cd ..
```

### 2. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat local node (keeps running)
npx hardhat node
```

This starts a local Ethereum node on `http://127.0.0.1:8545` with 20 test accounts.

### 3. Deploy Smart Contracts

```bash
# Terminal 2: Deploy all contracts
npx hardhat ignition deploy ./ignition/modules/Deploy.js --network localhost
```

Note the deployed contract addresses and update `frontend/lib/contracts.js` if different from defaults.

### 4. Start Backend API

```bash
# Terminal 3: Start Express server
npm run server
```

API runs on `http://localhost:3001`.

### 5. Start Frontend

```bash
# Terminal 4: Start Next.js dev server
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 6. Connect MetaMask

1. Open MetaMask → Add Network → **Hardhat Local**:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
2. Import a test account using a private key from the Hardhat node output
3. Navigate to `http://localhost:3000` and connect your wallet

## 🔑 Test Accounts (Hardhat)

| Role     | Account Index | Usage |
|:---------|:-------------|:------|
| Admin    | Account #0   | Deployer, has admin role automatically |
| Hospital | Account #1   | Register as hospital, get approved by admin |
| Doctor   | Account #2   | Registered by approved hospital |
| Patient  | Account #3   | Self-register, upload records |

## 📊 Performance Evaluation

### Run Gas Report
```bash
REPORT_GAS=true npx hardhat test
```

### Run Automated Benchmark
```bash
# Start local node first, then:
npx hardhat run performance/benchmark.js --network localhost
```

Results saved to `performance/results.json`.

### Run Encryption Benchmark
Open `performance/encryption-benchmark.html` in a browser. Tests AES-256-GCM across 100KB–10MB file sizes.

### View Metrics Dashboard
Navigate to Admin Dashboard → Performance tab (requires backend running).

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/RoleManager.test.js
npx hardhat test test/MedicalRecord.test.js
```

## 📁 Project Structure

```
P1/
├── contracts/              # Solidity smart contracts
│   ├── AuditLogger.sol     # Event-based audit trail
│   ├── RoleManager.sol     # RBAC with OpenZeppelin AccessControl
│   └── MedicalRecord.sol   # Record CIDs + access permissions
├── test/                   # Hardhat test suite (Mocha/Chai)
├── ignition/modules/       # Deployment scripts
├── server/                 # Express.js backend API
│   ├── index.js            # Server entry point
│   ├── db.js               # SQLite initialization
│   └── routes/             # API routes (users, metrics, audit)
├── frontend/               # Next.js + Tailwind CSS
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   │   └── dashboards/     # Role-based dashboard views
│   ├── contexts/           # Web3Context (MetaMask, contracts)
│   └── lib/                # Utilities (encryption, IPFS, metrics)
├── performance/            # Benchmark scripts & tools
│   ├── benchmark.js        # Automated gas/latency benchmark
│   └── encryption-benchmark.html  # Browser encryption test
├── hardhat.config.js       # Hardhat configuration
└── package.json            # Root dependencies
```

## 🔒 Security Design

1. **No PHI on-chain**: Only IPFS CIDs (hashes of encrypted files) are stored on the blockchain
2. **Client-side encryption**: AES-256-GCM via Web Crypto API — data encrypted before leaving browser
3. **Access control**: Smart contract enforces who can view record CIDs
4. **Audit trail**: Immutable event logs for every access, grant, and revoke operation
5. **Role hierarchy**: Admin → Hospital → Doctor, with patient self-registration

## 🌐 Deployment (Sepolia Testnet)

1. Get free Sepolia ETH from a [faucet](https://sepoliafaucet.com/)
2. Get an [Alchemy API key](https://www.alchemy.com/)
3. Copy `.env.example` to `.env` and fill in your keys
4. Deploy:
   ```bash
   npx hardhat ignition deploy ./ignition/modules/Deploy.js --network sepolia
   ```
5. Update contract addresses in `frontend/lib/contracts.js`

## 📝 Technology Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| Smart Contracts | Solidity 0.8.28, OpenZeppelin | RBAC, record management, audit |
| Framework | Hardhat + Ignition | Compilation, testing, deployment |
| Frontend | Next.js 14, React 18 | UI framework |
| Styling | Tailwind CSS 3 | Responsive design |
| Wallet | MetaMask + ethers.js v6 | Blockchain interaction |
| Encryption | Web Crypto API (AES-256-GCM) | Client-side file encryption |
| Storage | IPFS (Pinata) | Decentralized file storage |
| Backend | Express.js | REST API, metrics logging |
| Database | SQLite (better-sqlite3) | Off-chain user profiles |
| Testing | Mocha, Chai, hardhat-gas-reporter | Unit tests + gas analysis |

## 📄 License

MIT — For educational purposes.
