# Performance Evaluation Report
## Blockchain-Based Academic Certificate Verification System

**Generated:** 2026-09-14T18:47:41.412Z

---

## 1. Smart Contract Deployment Cost

| Metric | Value |
|--------|-------|
| Gas Used | 2781802 |
| Gas Price | 1.107421875 gwei |
| Cost | 0.00308062838671875 ETH |
| Deployment Latency | 12.02 ms |

---

## 2 & 3. Gas Consumption & Transaction Cost per Function

| Function | Gas Used | Cost (ETH) |
|----------|----------|------------|
| registerUniversity | 163675 | 0.0001607010403081 |
| registerStudent | 187701 | 0.000161379861267219 |
| issueCertificate | 329151 | 0.000247841477226621 |
| revokeCertificate | 34665 | 0.00002287484932542 |
| deactivateUniversity | 30955 | 0.00001787629785803 |

---

## 4. Certificate Issuance Latency

| Metric | Value |
|--------|-------|
| Average | 1.12 ms |
| Minimum | 0.81 ms |
| Maximum | 2.54 ms |
| Samples | 20 |

---

## 5. Verification Latency

| Metric | Value |
|--------|-------|
| Average | 0.46 ms |
| Minimum | 0.31 ms |
| Maximum | 1.67 ms |
| Samples | 20 |

---

## 6. Block Confirmation Time

| Metric | Value |
|--------|-------|
| Average | 0.94 ms |
| Samples | 10 |

---

## 7. Transaction Throughput (TPS)

| Metric | Value |
|--------|-------|
| Total Transactions | 50 |
| Duration | 0.130 s |
| Throughput | 384.38 TPS |

---

## 8. Success Rate

| Metric | Value |
|--------|-------|
| Total Operations | 30 |
| Successful | 30 |
| Failed | 0 |
| Success Rate | 100.00% |
| Correct Rejections | 2/3 |

---

## Scalability Analysis

| Volume | Total Time (s) | TPS | Avg Gas/Cert | Total Gas |
|--------|----------------|-----|--------------|-----------|
| 10 | 0.019 | 537.90 | 268696 | 2686960 |
| 50 | 0.096 | 521.59 | 267366 | 13368320 |
| 100 | 0.168 | 593.80 | 267229 | 26722960 |
| 200 | 0.306 | 653.01 | 267170 | 53434160 |

---

*Report generated automatically by performance-test.js*
