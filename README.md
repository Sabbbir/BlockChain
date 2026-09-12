# MSc Blockchain Course Assignments

This repository contains the implementations for the MSc Blockchain Course assignments. The repository is divided into three main projects, each representing a complete blockchain-based decentralized application (DApp) that solves a real-world problem.

## Projects Overview

### [P1: Blockchain-Based Healthcare Data Sharing](./P1)
**Problem:** Traditional healthcare information systems are isolated and centralized, making secure data sharing difficult and increasing the risk of data breaches. Patients also have limited control over who accesses their records.
**Solution:** A blockchain-based decentralized application for secure, transparent, and auditable medical data sharing with patient-controlled access.
**Key Features:**
- Patient, Doctor, and Hospital registration
- Medical record upload & encrypted sharing
- Granular permission granting and revocation
- Complete audit logs and administrator dashboard
**Performance Evaluations:** Smart contract deployment cost, Transaction cost, Gas consumption, Latency (upload/download/permissions), Encryption/Decryption time, Throughput/CPU/Memory usage, and Scalability analysis.

### [P2: Blockchain-Based Academic Certificate Verification System](./P2)
**Problem:** Academic certificate forgery is a widespread issue. Traditional centralized databases are vulnerable to modifications, loss, and breaches, making it difficult for employers to verify certificates efficiently.
**Solution:** An immutable, transparent ledger where certificate hashes are securely stored, allowing universities to issue tamper-proof digital certificates that can be verified instantly.
**Key Features:**
- University and Student registration
- Digital certificate issuance and revocation
- Instant certificate verification via QR code generation
- Administrator dashboard
**Performance Evaluations:** Smart contract deployment cost, Gas consumption, Transaction cost, Issuance and Verification latency, Block confirmation time, Transaction throughput (TPS), Success rate, and Scalability under different volumes.

### [P3: Blockchain-Based Secure Banking Transaction System](./P3)
**Problem:** Traditional banking systems rely on centralized databases that face challenges such as data tampering, delayed verification, limited transparency, and dependence on a central authority.
**Solution:** A blockchain-based banking transaction system providing transparent, immutable, and traceable financial records to ensure data integrity and improve trust.
**Key Features:**
- Customer registration and Account creation
- Secure deposits, withdrawals, and money transfers
- Immutable transaction history and receipts
- Account balance inquiry and Administrator dashboard
**Performance Evaluations:** Smart contract deployment cost, Average transaction cost, Gas consumption, Latency (deposit/withdrawal/transfer), Block confirmation time, Throughput (TPS), CPU and Memory usage, and Scalability under different transaction loads.

## Final Submission Requirements for Each Project
- **Assignment Report:** Maximum 15 pages detailing the problem statement, system architecture, technology stack, smart contracts, and performance evaluation.
- **Demonstration Video:** A 10-minute video demonstrating the system, its architecture, and performance evaluations (gas cost, latency, throughput, challenges, and future improvements).
