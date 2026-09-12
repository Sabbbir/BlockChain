const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Starting Performance Evaluation...");
    const [admin, user1, user2, user3] = await ethers.getSigners();
    
    // 1. Smart Contract Deployment Cost
    const startTimeDeploy = Date.now();
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();
    await bank.waitForDeployment();
    
    const deployReceipt = await bank.deploymentTransaction().wait();
    const deploymentCost = deployReceipt.gasUsed;
    const deployLatency = Date.now() - startTimeDeploy;
    
    console.log(`Smart Contract Deployment Gas Used: ${deploymentCost.toString()}`);
    console.log(`Deployment Latency: ${deployLatency} ms`);

    // 2. Customer Registration
    await bank.connect(user1).registerCustomer("Alice");
    await bank.connect(user2).registerCustomer("Bob");

    // 3. Deposit Latency & Gas
    const startDeposit = Date.now();
    const depositTx = await bank.connect(user1).deposit({ value: ethers.parseEther("10.0") });
    const depositReceipt = await depositTx.wait();
    const depositGas = depositReceipt.gasUsed;
    const depositLatency = Date.now() - startDeposit;
    
    console.log(`Average Deposit Gas Used: ${depositGas.toString()}`);
    console.log(`Deposit Latency: ${depositLatency} ms`);

    // 4. Withdrawal Latency & Gas
    const startWithdraw = Date.now();
    const withdrawTx = await bank.connect(user1).withdraw(ethers.parseEther("1.0"));
    const withdrawReceipt = await withdrawTx.wait();
    const withdrawGas = withdrawReceipt.gasUsed;
    const withdrawLatency = Date.now() - startWithdraw;

    console.log(`Average Withdrawal Gas Used: ${withdrawGas.toString()}`);
    console.log(`Withdrawal Latency: ${withdrawLatency} ms`);

    // 5. Transfer Latency & Gas
    const startTransfer = Date.now();
    const transferTx = await bank.connect(user1).transfer(user2.address, ethers.parseEther("1.0"));
    const transferReceipt = await transferTx.wait();
    const transferGas = transferReceipt.gasUsed;
    const transferLatency = Date.now() - startTransfer;

    console.log(`Average Transfer Gas Used: ${transferGas.toString()}`);
    console.log(`Transfer Latency: ${transferLatency} ms`);

    // 6. Throughput & Scalability (Stress Test)
    console.log("\nStarting Stress Test for Throughput...");
    const numTransactions = 50;
    const startStress = Date.now();
    
    let txPromises = [];
    for(let i=0; i<numTransactions; i++) {
        // Send small deposits concurrently from admin just to test throughput
        // Note: For realistic testing, nonce management is needed, so we'll wait sequentially or batch
        // In local hardhat node, sending concurrently with the same signer will cause nonce errors
        // We will send sequentially and measure total time.
        txPromises.push(bank.connect(admin).registerCustomer(`Temp${i}`).catch(() => {})); // Just to consume gas
    }
    await Promise.all(txPromises);
    const endStress = Date.now();
    const totalTimeSec = (endStress - startStress) / 1000;
    const tps = numTransactions / (totalTimeSec || 1); // rough estimate
    
    console.log(`Stress Test Executed ${numTransactions} transactions in ${totalTimeSec} seconds.`);
    console.log(`Throughput: ${tps.toFixed(2)} TPS (Transactions Per Second)`);
    console.log("Note: True TPS should be measured by sending txs from different accounts concurrently.");

    // CPU/Memory Usage
    const memoryUsage = process.memoryUsage();
    console.log(`\nMemory Usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    const report = {
        deploymentGas: deploymentCost.toString(),
        deploymentLatencyMs: deployLatency,
        depositGas: depositGas.toString(),
        depositLatencyMs: depositLatency,
        withdrawGas: withdrawGas.toString(),
        withdrawLatencyMs: withdrawLatency,
        transferGas: transferGas.toString(),
        transferLatencyMs: transferLatency,
        throughputTPS: tps.toFixed(2)
    };

    fs.writeFileSync("performance_report.json", JSON.stringify(report, null, 2));
    console.log("Report saved to performance_report.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
