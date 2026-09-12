const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Performance Evaluation Script
 * Measures all 8 required metrics + scalability testing:
 *  1. Smart contract deployment cost
 *  2. Gas consumption per function
 *  3. Transaction cost (Gas Fee)
 *  4. Certificate issuance latency
 *  5. Verification latency
 *  6. Block confirmation time
 *  7. Transaction throughput (TPS)
 *  8. Success rate
 *  + Scalability: multiple certificate volumes
 */

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  BLOCKCHAIN CERTIFICATE SYSTEM — PERFORMANCE EVALUATION  ");
  console.log("═══════════════════════════════════════════════════════════\n");

  const [admin, uni1, uni2] = await hre.ethers.getSigners();
  const results = {};

  // ─────────────────────────────────────────────────────────
  //  1. DEPLOYMENT COST
  // ─────────────────────────────────────────────────────────
  console.log("📦 1. Measuring Smart Contract Deployment Cost...");
  const deployStart = performance.now();

  const Factory = await hre.ethers.getContractFactory("CertificateManager");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const deployEnd = performance.now();
  const deployTx = contract.deploymentTransaction();
  const deployReceipt = await deployTx.wait();

  const deployGas = deployReceipt.gasUsed;
  const deployGasPrice = deployTx.gasPrice || 0n;
  const deployCostWei = deployGas * deployGasPrice;

  results.deployment = {
    gasUsed: deployGas.toString(),
    gasPriceGwei: hre.ethers.formatUnits(deployGasPrice, "gwei"),
    costETH: hre.ethers.formatEther(deployCostWei),
    latencyMs: (deployEnd - deployStart).toFixed(2),
  };

  console.log(`   Gas Used: ${deployGas}`);
  console.log(
    `   Gas Price: ${hre.ethers.formatUnits(deployGasPrice, "gwei")} gwei`
  );
  console.log(`   Cost: ${hre.ethers.formatEther(deployCostWei)} ETH`);
  console.log(
    `   Deployment Latency: ${(deployEnd - deployStart).toFixed(2)} ms\n`
  );

  // ─────────────────────────────────────────────────────────
  //  2 & 3. GAS CONSUMPTION & TRANSACTION COST PER FUNCTION
  // ─────────────────────────────────────────────────────────
  console.log("⛽ 2 & 3. Measuring Gas Consumption & Transaction Cost...");
  results.gasByFunction = {};

  // Register University
  let tx = await contract.registerUniversity(
    uni1.address,
    "Dhaka University",
    "Bangladesh"
  );
  let receipt = await tx.wait();
  results.gasByFunction.registerUniversity = {
    gasUsed: receipt.gasUsed.toString(),
    costETH: hre.ethers.formatEther(receipt.gasUsed * (tx.gasPrice || 0n)),
  };
  console.log(`   registerUniversity: ${receipt.gasUsed} gas`);

  // Register Student
  tx = await contract
    .connect(uni1)
    .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
  receipt = await tx.wait();
  results.gasByFunction.registerStudent = {
    gasUsed: receipt.gasUsed.toString(),
    costETH: hre.ethers.formatEther(receipt.gasUsed * (tx.gasPrice || 0n)),
  };
  console.log(`   registerStudent:    ${receipt.gasUsed} gas`);

  // Issue Certificate
  tx = await contract
    .connect(uni1)
    .issueCertificate(
      "CERT-001",
      "STU-001",
      "Computer Science",
      "A+",
      "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
    );
  receipt = await tx.wait();
  results.gasByFunction.issueCertificate = {
    gasUsed: receipt.gasUsed.toString(),
    costETH: hre.ethers.formatEther(receipt.gasUsed * (tx.gasPrice || 0n)),
  };
  console.log(`   issueCertificate:   ${receipt.gasUsed} gas`);

  // Revoke Certificate
  tx = await contract.connect(uni1).revokeCertificate("CERT-001");
  receipt = await tx.wait();
  results.gasByFunction.revokeCertificate = {
    gasUsed: receipt.gasUsed.toString(),
    costETH: hre.ethers.formatEther(receipt.gasUsed * (tx.gasPrice || 0n)),
  };
  console.log(`   revokeCertificate:  ${receipt.gasUsed} gas`);

  // Deactivate University
  tx = await contract.deactivateUniversity(uni1.address);
  receipt = await tx.wait();
  results.gasByFunction.deactivateUniversity = {
    gasUsed: receipt.gasUsed.toString(),
    costETH: hre.ethers.formatEther(receipt.gasUsed * (tx.gasPrice || 0n)),
  };
  console.log(`   deactivateUniv:     ${receipt.gasUsed} gas\n`);

  // ─────────────────────────────────────────────────────────
  //  4. CERTIFICATE ISSUANCE LATENCY
  // ─────────────────────────────────────────────────────────
  console.log("⏱️  4. Measuring Certificate Issuance Latency...");

  // Redeploy a fresh contract for latency tests
  const freshContract = await Factory.deploy();
  await freshContract.waitForDeployment();
  await (
    await freshContract.registerUniversity(
      uni1.address,
      "Dhaka University",
      "Bangladesh"
    )
  ).wait();

  const issuanceLatencies = [];
  const NUM_LATENCY_TESTS = 20;

  for (let i = 0; i < NUM_LATENCY_TESTS; i++) {
    const stuId = `LAT-STU-${i}`;
    const certId = `LAT-CERT-${i}`;
    await (
      await freshContract
        .connect(uni1)
        .registerStudent(stuId, `Student ${i}`, `student${i}@test.com`)
    ).wait();

    const start = performance.now();
    const issueTx = await freshContract
      .connect(uni1)
      .issueCertificate(certId, stuId, `Course ${i}`, "A", `QmHash${i}`);
    await issueTx.wait();
    const end = performance.now();

    issuanceLatencies.push(end - start);
  }

  const avgIssuance =
    issuanceLatencies.reduce((a, b) => a + b, 0) / issuanceLatencies.length;
  const minIssuance = Math.min(...issuanceLatencies);
  const maxIssuance = Math.max(...issuanceLatencies);

  results.issuanceLatency = {
    avgMs: avgIssuance.toFixed(2),
    minMs: minIssuance.toFixed(2),
    maxMs: maxIssuance.toFixed(2),
    samples: NUM_LATENCY_TESTS,
  };

  console.log(`   Average: ${avgIssuance.toFixed(2)} ms`);
  console.log(`   Min: ${minIssuance.toFixed(2)} ms`);
  console.log(`   Max: ${maxIssuance.toFixed(2)} ms\n`);

  // ─────────────────────────────────────────────────────────
  //  5. VERIFICATION LATENCY
  // ─────────────────────────────────────────────────────────
  console.log("🔍 5. Measuring Verification Latency...");

  const verifyLatencies = [];

  for (let i = 0; i < NUM_LATENCY_TESTS; i++) {
    const certId = `LAT-CERT-${i}`;

    const start = performance.now();
    await freshContract.verifyCertificate(certId);
    const end = performance.now();

    verifyLatencies.push(end - start);
  }

  const avgVerify =
    verifyLatencies.reduce((a, b) => a + b, 0) / verifyLatencies.length;
  const minVerify = Math.min(...verifyLatencies);
  const maxVerify = Math.max(...verifyLatencies);

  results.verificationLatency = {
    avgMs: avgVerify.toFixed(2),
    minMs: minVerify.toFixed(2),
    maxMs: maxVerify.toFixed(2),
    samples: NUM_LATENCY_TESTS,
  };

  console.log(`   Average: ${avgVerify.toFixed(2)} ms`);
  console.log(`   Min: ${minVerify.toFixed(2)} ms`);
  console.log(`   Max: ${maxVerify.toFixed(2)} ms\n`);

  // ─────────────────────────────────────────────────────────
  //  6. BLOCK CONFIRMATION TIME
  // ─────────────────────────────────────────────────────────
  console.log("⛓️  6. Measuring Block Confirmation Time...");

  const confirmTimes = [];
  for (let i = 0; i < 10; i++) {
    const stuId = `BLK-STU-${i}`;
    await (
      await freshContract
        .connect(uni1)
        .registerStudent(stuId, `Block Student ${i}`, `blk${i}@test.com`)
    ).wait();

    const certId = `BLK-CERT-${i}`;
    const start = performance.now();
    const blkTx = await freshContract
      .connect(uni1)
      .issueCertificate(certId, stuId, `Course ${i}`, "A", `QmBlk${i}`);
    const blkReceipt = await blkTx.wait();
    const end = performance.now();

    confirmTimes.push(end - start);
  }

  const avgConfirm =
    confirmTimes.reduce((a, b) => a + b, 0) / confirmTimes.length;

  results.blockConfirmation = {
    avgMs: avgConfirm.toFixed(2),
    samples: 10,
  };

  console.log(`   Average Block Confirmation: ${avgConfirm.toFixed(2)} ms\n`);

  // ─────────────────────────────────────────────────────────
  //  7. TRANSACTION THROUGHPUT (TPS)
  // ─────────────────────────────────────────────────────────
  console.log("📈 7. Measuring Transaction Throughput (TPS)...");

  // Prepare students for throughput test
  const tpsContract = await Factory.deploy();
  await tpsContract.waitForDeployment();
  await (
    await tpsContract.registerUniversity(
      uni1.address,
      "TPS University",
      "Bangladesh"
    )
  ).wait();

  const TPS_COUNT = 50;

  // Pre-register students
  for (let i = 0; i < TPS_COUNT; i++) {
    await (
      await tpsContract
        .connect(uni1)
        .registerStudent(
          `TPS-STU-${i}`,
          `TPS Student ${i}`,
          `tps${i}@test.com`
        )
    ).wait();
  }

  // Send all certificate issuance transactions as fast as possible
  const tpsStart = performance.now();
  const txPromises = [];

  for (let i = 0; i < TPS_COUNT; i++) {
    const p = tpsContract
      .connect(uni1)
      .issueCertificate(
        `TPS-CERT-${i}`,
        `TPS-STU-${i}`,
        `Course ${i}`,
        "A",
        `QmTps${i}`
      );
    txPromises.push(p);
  }

  const sentTxs = await Promise.all(txPromises);
  const receiptPromises = sentTxs.map((t) => t.wait());
  await Promise.all(receiptPromises);

  const tpsEnd = performance.now();
  const tpsDuration = (tpsEnd - tpsStart) / 1000; // seconds
  const tps = TPS_COUNT / tpsDuration;

  results.throughput = {
    totalTransactions: TPS_COUNT,
    durationSec: tpsDuration.toFixed(3),
    tps: tps.toFixed(2),
  };

  console.log(`   Transactions: ${TPS_COUNT}`);
  console.log(`   Duration: ${tpsDuration.toFixed(3)} s`);
  console.log(`   Throughput: ${tps.toFixed(2)} TPS\n`);

  // ─────────────────────────────────────────────────────────
  //  8. SUCCESS RATE
  // ─────────────────────────────────────────────────────────
  console.log("✅ 8. Measuring Success Rate...");

  const successContract = await Factory.deploy();
  await successContract.waitForDeployment();
  await (
    await successContract.registerUniversity(
      uni1.address,
      "Success University",
      "Bangladesh"
    )
  ).wait();

  let successCount = 0;
  let failCount = 0;
  const TOTAL_TESTS = 30;

  for (let i = 0; i < TOTAL_TESTS; i++) {
    try {
      // Register student and issue certificate
      await (
        await successContract
          .connect(uni1)
          .registerStudent(
            `SR-STU-${i}`,
            `SR Student ${i}`,
            `sr${i}@test.com`
          )
      ).wait();
      await (
        await successContract
          .connect(uni1)
          .issueCertificate(
            `SR-CERT-${i}`,
            `SR-STU-${i}`,
            `Course ${i}`,
            "A",
            `QmSR${i}`
          )
      ).wait();

      // Verify it
      await successContract.verifyCertificate(`SR-CERT-${i}`);
      successCount++;
    } catch (e) {
      failCount++;
    }
  }

  // Also test expected failures (these SHOULD fail)
  const expectedFailures = [
    // Non-university tries to issue
    async () =>
      await successContract
        .connect(uni2)
        .issueCertificate("FAIL-1", "SR-STU-0", "CS", "A", "QmFail"),
    // Duplicate certificate
    async () =>
      await successContract
        .connect(uni1)
        .issueCertificate("SR-CERT-0", "SR-STU-0", "CS", "A", "QmFail"),
    // Verify non-existent
    async () => await successContract.verifyCertificate("NONEXISTENT"),
  ];

  let correctRejections = 0;
  for (const fn of expectedFailures) {
    try {
      await fn();
    } catch {
      correctRejections++;
    }
  }

  const successRate = ((successCount / TOTAL_TESTS) * 100).toFixed(2);

  results.successRate = {
    total: TOTAL_TESTS,
    successful: successCount,
    failed: failCount,
    rate: `${successRate}%`,
    expectedRejections: `${correctRejections}/${expectedFailures.length}`,
  };

  console.log(`   Successful: ${successCount}/${TOTAL_TESTS}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(
    `   Correct Rejections: ${correctRejections}/${expectedFailures.length}\n`
  );

  // ─────────────────────────────────────────────────────────
  //  SCALABILITY TEST
  // ─────────────────────────────────────────────────────────
  console.log("📊 SCALABILITY TEST — Multiple Certificate Volumes...");

  const volumes = [10, 50, 100, 200];
  results.scalability = [];

  for (const volume of volumes) {
    const scaleContract = await Factory.deploy();
    await scaleContract.waitForDeployment();
    await (
      await scaleContract.registerUniversity(
        uni1.address,
        "Scale University",
        "Bangladesh"
      )
    ).wait();

    // Pre-register students
    for (let i = 0; i < volume; i++) {
      await (
        await scaleContract
          .connect(uni1)
          .registerStudent(
            `SC-${volume}-STU-${i}`,
            `Student ${i}`,
            `sc${i}@test.com`
          )
      ).wait();
    }

    // Issue certificates and measure
    const scaleStart = performance.now();
    let scaleGasTotal = 0n;

    for (let i = 0; i < volume; i++) {
      const stx = await scaleContract
        .connect(uni1)
        .issueCertificate(
          `SC-${volume}-CERT-${i}`,
          `SC-${volume}-STU-${i}`,
          `Course ${i}`,
          "A",
          `QmScale${i}`
        );
      const sr = await stx.wait();
      scaleGasTotal += sr.gasUsed;
    }

    const scaleEnd = performance.now();
    const scaleDuration = (scaleEnd - scaleStart) / 1000;
    const scaleTps = volume / scaleDuration;
    const avgGasPerCert = scaleGasTotal / BigInt(volume);

    const scaleResult = {
      volume,
      totalTimeSec: scaleDuration.toFixed(3),
      tps: scaleTps.toFixed(2),
      avgGasPerCert: avgGasPerCert.toString(),
      totalGas: scaleGasTotal.toString(),
    };

    results.scalability.push(scaleResult);

    console.log(`   Volume ${volume}:`);
    console.log(`     Time: ${scaleDuration.toFixed(3)} s`);
    console.log(`     TPS: ${scaleTps.toFixed(2)}`);
    console.log(`     Avg Gas/Cert: ${avgGasPerCert}`);
  }

  // ─────────────────────────────────────────────────────────
  //  SAVE RESULTS
  // ─────────────────────────────────────────────────────────
  const outputDir = path.join(__dirname, "../../docs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save raw JSON
  fs.writeFileSync(
    path.join(outputDir, "performance-results.json"),
    JSON.stringify(results, null, 2)
  );

  // Generate markdown report
  const report = generateMarkdownReport(results);
  fs.writeFileSync(path.join(outputDir, "performance-report.md"), report);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Performance evaluation complete!");
  console.log("  📄 Results saved to docs/performance-results.json");
  console.log("  📄 Report saved to docs/performance-report.md");
  console.log("═══════════════════════════════════════════════════════════");
}

function generateMarkdownReport(r) {
  return `# Performance Evaluation Report
## Blockchain-Based Academic Certificate Verification System

**Generated:** ${new Date().toISOString()}

---

## 1. Smart Contract Deployment Cost

| Metric | Value |
|--------|-------|
| Gas Used | ${r.deployment.gasUsed} |
| Gas Price | ${r.deployment.gasPriceGwei} gwei |
| Cost | ${r.deployment.costETH} ETH |
| Deployment Latency | ${r.deployment.latencyMs} ms |

---

## 2 & 3. Gas Consumption & Transaction Cost per Function

| Function | Gas Used | Cost (ETH) |
|----------|----------|------------|
| registerUniversity | ${r.gasByFunction.registerUniversity.gasUsed} | ${r.gasByFunction.registerUniversity.costETH} |
| registerStudent | ${r.gasByFunction.registerStudent.gasUsed} | ${r.gasByFunction.registerStudent.costETH} |
| issueCertificate | ${r.gasByFunction.issueCertificate.gasUsed} | ${r.gasByFunction.issueCertificate.costETH} |
| revokeCertificate | ${r.gasByFunction.revokeCertificate.gasUsed} | ${r.gasByFunction.revokeCertificate.costETH} |
| deactivateUniversity | ${r.gasByFunction.deactivateUniversity.gasUsed} | ${r.gasByFunction.deactivateUniversity.costETH} |

---

## 4. Certificate Issuance Latency

| Metric | Value |
|--------|-------|
| Average | ${r.issuanceLatency.avgMs} ms |
| Minimum | ${r.issuanceLatency.minMs} ms |
| Maximum | ${r.issuanceLatency.maxMs} ms |
| Samples | ${r.issuanceLatency.samples} |

---

## 5. Verification Latency

| Metric | Value |
|--------|-------|
| Average | ${r.verificationLatency.avgMs} ms |
| Minimum | ${r.verificationLatency.minMs} ms |
| Maximum | ${r.verificationLatency.maxMs} ms |
| Samples | ${r.verificationLatency.samples} |

---

## 6. Block Confirmation Time

| Metric | Value |
|--------|-------|
| Average | ${r.blockConfirmation.avgMs} ms |
| Samples | ${r.blockConfirmation.samples} |

---

## 7. Transaction Throughput (TPS)

| Metric | Value |
|--------|-------|
| Total Transactions | ${r.throughput.totalTransactions} |
| Duration | ${r.throughput.durationSec} s |
| Throughput | ${r.throughput.tps} TPS |

---

## 8. Success Rate

| Metric | Value |
|--------|-------|
| Total Operations | ${r.successRate.total} |
| Successful | ${r.successRate.successful} |
| Failed | ${r.successRate.failed} |
| Success Rate | ${r.successRate.rate} |
| Correct Rejections | ${r.successRate.expectedRejections} |

---

## Scalability Analysis

| Volume | Total Time (s) | TPS | Avg Gas/Cert | Total Gas |
|--------|----------------|-----|--------------|-----------|
${r.scalability.map((s) => `| ${s.volume} | ${s.totalTimeSec} | ${s.tps} | ${s.avgGasPerCert} | ${s.totalGas} |`).join("\n")}

---

*Report generated automatically by performance-test.js*
`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
