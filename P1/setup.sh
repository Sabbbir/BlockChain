#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Healthcare DApp — One-Click Setup Script
# ═══════════════════════════════════════════════════════════
# Run this from the P1 directory:
#   chmod +x setup.sh && ./setup.sh

set -e

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🏥 Healthcare DApp — Setup Script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm $(npm --version)"

# Step 1: Install root dependencies (Hardhat, Solidity, Backend)
echo ""
echo "📦 Step 1: Installing root dependencies..."
npm install

# Step 2: Copy .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "✅ .env already exists"
fi

# Step 3: Compile smart contracts
echo ""
echo "⚙️ Step 2: Compiling smart contracts..."
npx hardhat compile

# Step 4: Run tests
echo ""
echo "🧪 Step 3: Running smart contract tests..."
npx hardhat test

# Step 5: Run tests with gas reporting
echo ""
echo "📊 Step 4: Running tests with gas reporting..."
REPORT_GAS=true npx hardhat test

# Step 6: Install frontend dependencies
echo ""
echo "📦 Step 5: Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Start local blockchain:    npx hardhat node"
echo "  2. Deploy contracts:          npx hardhat ignition deploy ./ignition/modules/Deploy.js --network localhost"
echo "  3. Start backend API:         npm run server"
echo "  4. Start frontend:            cd frontend && npm run dev"
echo "  5. Open browser:              http://localhost:3000"
echo ""
echo "  Performance tools:"
echo "  • Gas report:                 REPORT_GAS=true npx hardhat test"
echo "  • Benchmark:                  npx hardhat run performance/benchmark.js --network localhost"
echo "  • Encryption benchmark:       Open performance/encryption-benchmark.html"
echo ""
