# Performance Evaluation Report
## Blockchain-Based Academic Certificate Verification System

**Generated:** 2026-08-07T09:54:17.015Z

---

## 1. Smart Contract Deployment Cost

| Metric | Value |
|--------|-------|
| Gas Used | 2821925 |
| Gas Price | 1.107421875 gwei |
| Cost | 0.003125061474609375 ETH |
| Deployment Latency | 11.75 ms |

---

## 2 & 3. Gas Consumption & Transaction Cost per Function

| Function | Gas Used | Cost (ETH) |
|----------|----------|------------|
| registerUniversity | 163658 | 0.000160714648674998 |
| registerStudent | 187628 | 0.000161347503670416 |
| issueCertificate | 329138 | 0.000247878314609216 |
| revokeCertificate | 34665 | 0.000022879151494575 |
| deactivateUniversity | 30955 | 0.00001787965994249 |

---

## 4. Certificate Issuance Latency

| Metric | Value |
|--------|-------|
| Average | 1.46 ms |
| Minimum | 0.95 ms |
| Maximum | 3.36 ms |
| Samples | 20 |

---

## 5. Verification Latency

| Metric | Value |
|--------|-------|
| Average | 0.59 ms |
| Minimum | 0.42 ms |
| Maximum | 1.69 ms |
| Samples | 20 |

---

## 6. Block Confirmation Time

| Metric | Value |
|--------|-------|
| Average | 1.58 ms |
| Samples | 10 |

---

## 7. Transaction Throughput (TPS)

| Metric | Value |
|--------|-------|
| Total Transactions | 50 |
| Duration | 0.124 s |
| Throughput | 401.92 TPS |

---

## 8. Success Rate

| Metric | Value |
|--------|-------|
| Total Operations | 30 |
| Successful | 30 |
| Failed | 0 |
| Success Rate | 100.00% |
| Correct Rejections | 3/3 |

---

## Scalability Analysis

| Volume | Total Time (s) | TPS | Avg Gas/Cert | Total Gas |
|--------|----------------|-----|--------------|-----------|
| 10 | 0.022 | 463.96 | 268683 | 2686830 |
| 50 | 0.120 | 415.65 | 267353 | 13367670 |
| 100 | 0.224 | 447.16 | 267216 | 26721660 |
| 200 | 0.505 | 396.12 | 267157 | 53431560 |

---

*Report generated automatically by performance-test.js*
