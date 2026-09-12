const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CertificateManager...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balanceBefore = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balanceBefore), "ETH");

  // Deploy
  const CertificateManager = await hre.ethers.getContractFactory(
    "CertificateManager"
  );
  const contract = await CertificateManager.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  const deploymentCost = balanceBefore - balanceAfter;

  console.log("\n✅ CertificateManager deployed!");
  console.log("   Contract Address:", contractAddress);
  console.log(
    "   Deployment Cost:",
    hre.ethers.formatEther(deploymentCost),
    "ETH"
  );

  // Get deployment transaction receipt for gas info
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas Used:", receipt.gasUsed.toString());
    console.log(
      "   Gas Price:",
      hre.ethers.formatUnits(deployTx.gasPrice || 0n, "gwei"),
      "gwei"
    );
  }

  // Save contract info for frontend
  const artifact = await hre.artifacts.readArtifact("CertificateManager");
  const contractInfo = {
    address: contractAddress,
    abi: artifact.abi,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  // Save to frontend directory
  const frontendDir = path.join(__dirname, "../../frontend/js");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendDir, "contract-config.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("\n📄 Contract ABI & address saved to frontend/js/contract-config.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
