/**
 * Performance Benchmark Script
 *
 * Deploys all contracts to a local Hardhat node and runs a comprehensive
 * benchmark of every operation, measuring:
 *   - Gas consumption per function
 *   - Transaction latency
 *   - Deployment costs
 *
 * Usage:
 *   npx hardhat node                           # Terminal 1
 *   npx hardhat run performance/benchmark.js --network localhost  # Terminal 2
 *
 * Output: performance/results.json + console summary
 */

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🏥 Healthcare DApp — Performance Benchmark Suite");
  console.log("═══════════════════════════════════════════════════════════\n");

  const results = {
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    deployment: {},
    transactions: {},
    summary: {},
  };

  const [admin, hospital, doctor, doctor2, patient, patient2] =
    await ethers.getSigners();

  // ─── Phase 1: Deployment Benchmarks ─────────────────────────────

  console.log("📦 Phase 1: Deployment Benchmarks\n");

  // Deploy AuditLogger
  let start = performance.now();
  const AuditLogger = await ethers.getContractFactory("AuditLogger");
  const auditLogger = await AuditLogger.deploy();
  const alReceipt = await auditLogger.deploymentTransaction().wait();
  let duration = performance.now() - start;

  results.deployment.AuditLogger = {
    address: await auditLogger.getAddress(),
    gasUsed: Number(alReceipt.gasUsed),
    duration_ms: duration,
  };
  printDeployment("AuditLogger", alReceipt, duration);

  // Deploy RoleManager
  start = performance.now();
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy(await auditLogger.getAddress());
  const rmReceipt = await roleManager.deploymentTransaction().wait();
  duration = performance.now() - start;

  results.deployment.RoleManager = {
    address: await roleManager.getAddress(),
    gasUsed: Number(rmReceipt.gasUsed),
    duration_ms: duration,
  };
  printDeployment("RoleManager", rmReceipt, duration);

  // Deploy MedicalRecord
  start = performance.now();
  const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
  const medicalRecord = await MedicalRecord.deploy(
    await roleManager.getAddress(),
    await auditLogger.getAddress()
  );
  const mrReceipt = await medicalRecord.deploymentTransaction().wait();
  duration = performance.now() - start;

  results.deployment.MedicalRecord = {
    address: await medicalRecord.getAddress(),
    gasUsed: Number(mrReceipt.gasUsed),
    duration_ms: duration,
  };
  printDeployment("MedicalRecord", mrReceipt, duration);

  const totalDeployGas =
    results.deployment.AuditLogger.gasUsed +
    results.deployment.RoleManager.gasUsed +
    results.deployment.MedicalRecord.gasUsed;

  console.log(`\n  💰 Total Deployment Gas: ${totalDeployGas.toLocaleString()}\n`);

  // ─── Phase 2: Transaction Benchmarks ────────────────────────────

  console.log("─────────────────────────────────────────────────────────");
  console.log("⚡ Phase 2: Transaction Benchmarks\n");

  // Register Patient
  results.transactions.registerPatient = await benchmark(
    "Register Patient",
    () => roleManager.connect(patient).registerPatient()
  );

  // Register Patient 2
  await (await roleManager.connect(patient2).registerPatient()).wait();

  // Request Hospital Registration
  results.transactions.requestHospitalRegistration = await benchmark(
    "Request Hospital Registration",
    () => roleManager.connect(hospital).requestHospitalRegistration()
  );

  // Approve Hospital
  results.transactions.approveHospital = await benchmark(
    "Approve Hospital",
    () => roleManager.connect(admin).approveHospital(hospital.address)
  );

  // Register Doctor
  results.transactions.registerDoctor = await benchmark(
    "Register Doctor",
    () => roleManager.connect(hospital).registerDoctor(doctor.address)
  );

  // Register Doctor 2
  await (
    await roleManager.connect(hospital).registerDoctor(doctor2.address)
  ).wait();

  // Upload Record (x3 for averaging)
  const uploadResults = [];
  for (let i = 0; i < 3; i++) {
    const result = await benchmark(`Upload Record #${i + 1}`, () =>
      medicalRecord
        .connect(patient)
        .uploadRecord(`QmHash_benchmark_${i}`, `test_file_${i}.pdf`)
    );
    uploadResults.push(result);
  }
  results.transactions.uploadRecord = {
    avg_gas: Math.round(
      uploadResults.reduce((sum, r) => sum + r.gasUsed, 0) / uploadResults.length
    ),
    avg_duration_ms:
      uploadResults.reduce((sum, r) => sum + r.duration_ms, 0) /
      uploadResults.length,
    samples: uploadResults,
  };

  // Grant Access
  results.transactions.grantAccess = await benchmark("Grant Access", () =>
    medicalRecord.connect(patient).grantAccess(doctor.address)
  );

  // Grant Access to Doctor 2
  results.transactions.grantAccess2 = await benchmark(
    "Grant Access (Doctor 2)",
    () => medicalRecord.connect(patient).grantAccess(doctor2.address)
  );

  // Get Records (view function — note: this triggers a state change via getRecords)
  results.transactions.getRecords = await benchmark(
    "Get Records (as Doctor)",
    () => medicalRecord.connect(doctor).getRecords(patient.address)
  );

  // Revoke Access
  results.transactions.revokeAccess = await benchmark("Revoke Access", () =>
    medicalRecord.connect(patient).revokeAccess(doctor2.address)
  );

  // Get System Stats (view — no gas)
  start = performance.now();
  const stats = await roleManager.getSystemStats();
  duration = performance.now() - start;
  results.transactions.getSystemStats = {
    duration_ms: duration,
    gasUsed: 0,
    note: "View function (no gas cost)",
    result: {
      admins: Number(stats[0]),
      hospitals: Number(stats[1]),
      doctors: Number(stats[2]),
      patients: Number(stats[3]),
    },
  };
  console.log(
    `  📖 Get System Stats        │ ${duration.toFixed(2).padStart(10)}ms │     N/A (view)`
  );

  // ─── Phase 3: Summary ──────────────────────────────────────────

  console.log("\n─────────────────────────────────────────────────────────");
  console.log("📊 Phase 3: Summary Report\n");

  const gasPrice_gwei = 20; // Approximate gas price
  const ethPrice_usd = 3500; // Approximate ETH price

  // Calculate costs
  const costTable = [];
  for (const [name, data] of Object.entries(results.transactions)) {
    const gas = data.avg_gas || data.gasUsed || 0;
    if (gas > 0) {
      const costEth = (gas * gasPrice_gwei * 1e-9);
      const costUsd = costEth * ethPrice_usd;
      costTable.push({
        operation: name,
        gas,
        costEth: costEth.toFixed(6),
        costUsd: costUsd.toFixed(4),
        latency: (data.avg_duration_ms || data.duration_ms || 0).toFixed(1),
      });
    }
  }

  // Print cost table
  console.log(
    "  Operation                    │     Gas Used │   Cost (ETH) │  Cost (USD) │ Latency (ms)"
  );
  console.log(
    "  ─────────────────────────────┼──────────────┼──────────────┼─────────────┼─────────────"
  );
  for (const row of costTable) {
    console.log(
      `  ${row.operation.padEnd(30)}│ ${row.gas
        .toLocaleString()
        .padStart(12)} │ ${row.costEth.padStart(12)} │ $${row.costUsd.padStart(10)} │ ${row.latency.padStart(8)}ms`
    );
  }

  results.summary = {
    gasPrice_gwei,
    ethPrice_usd,
    costBreakdown: costTable,
    totalDeploymentGas: totalDeployGas,
    totalDeploymentCostEth: (totalDeployGas * gasPrice_gwei * 1e-9).toFixed(6),
    totalDeploymentCostUsd: (
      totalDeployGas *
      gasPrice_gwei *
      1e-9 *
      ethPrice_usd
    ).toFixed(4),
  };

  console.log(
    `\n  💰 Total Deployment: ${totalDeployGas.toLocaleString()} gas = ${results.summary.totalDeploymentCostEth} ETH ≈ $${results.summary.totalDeploymentCostUsd}`
  );

  // Save results
  const fs = require("fs");
  const outputPath = __dirname + "/results.json";
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n  ✅ Results saved to: ${outputPath}`);
  console.log("\n═══════════════════════════════════════════════════════════\n");
}

// ─── Helpers ────────────────────────────────────────────────────────

async function benchmark(name, txFn) {
  const start = performance.now();
  const tx = await txFn();
  const receipt = await tx.wait();
  const duration = performance.now() - start;
  const gasUsed = Number(receipt.gasUsed);

  console.log(
    `  ⚡ ${name.padEnd(28)}│ ${duration
      .toFixed(2)
      .padStart(10)}ms │ Gas: ${gasUsed.toLocaleString().padStart(10)}`
  );

  return { gasUsed, duration_ms: duration, txHash: receipt.hash };
}

function printDeployment(name, receipt, duration) {
  console.log(
    `  📦 ${name.padEnd(20)} │ Gas: ${Number(receipt.gasUsed)
      .toLocaleString()
      .padStart(12)} │ ${duration.toFixed(1)}ms`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
