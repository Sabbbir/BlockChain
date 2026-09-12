const express = require("express");
const router = express.Router();

/**
 * Audit Routes — Provides an API interface to query blockchain audit events.
 * Since audit events are stored as Ethereum event logs (not in contract state),
 * the frontend typically queries them directly via ethers.js filters.
 * This endpoint provides a backend alternative for caching/searching.
 */

// GET /api/audit — Get audit log entries
// In production, this would query an indexer (The Graph) or cache blockchain events
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Audit logs are read directly from blockchain events via ethers.js on the frontend.",
    instructions: {
      how_to_query: "Use the AuditLogger contract's event filters in ethers.js",
      events: [
        "RecordUploaded(address indexed patient, string ipfsHash, string fileName, uint256 timestamp)",
        "AccessGranted(address indexed patient, address indexed doctor, uint256 timestamp)",
        "AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp)",
        "RecordAccessed(address indexed patient, address indexed accessor, string ipfsHash, uint256 timestamp)",
        "UserRegistered(address indexed user, string role, uint256 timestamp)",
        "HospitalApproved(address indexed hospital, address indexed approvedBy, uint256 timestamp)",
      ],
      example_code: `
        const filter = auditLogger.filters.RecordUploaded(patientAddress);
        const events = await auditLogger.queryFilter(filter, fromBlock, toBlock);
      `,
    },
  });
});

module.exports = router;
