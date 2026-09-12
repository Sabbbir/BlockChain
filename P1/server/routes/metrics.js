const express = require("express");
const router = express.Router();
const { getDb } = require("../db");

/**
 * Metrics Routes — Logs and retrieves performance metrics for evaluation.
 * Every blockchain transaction, encryption, IPFS upload, etc. is measured
 * and stored here for the performance report.
 */

// POST /api/metrics — Log a new performance metric
router.post("/", (req, res) => {
  try {
    const db = getDb();
    const {
      operation,
      duration_ms,
      gas_used,
      gas_price_gwei,
      cost_eth,
      file_size_bytes,
      tx_hash,
      block_number,
      network,
      metadata,
    } = req.body;

    if (!operation || duration_ms === undefined) {
      return res.status(400).json({
        success: false,
        error: "operation and duration_ms are required",
      });
    }

    const stmt = db.prepare(`
      INSERT INTO performance_metrics
        (operation, duration_ms, gas_used, gas_price_gwei, cost_eth, file_size_bytes, tx_hash, block_number, network, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      operation,
      duration_ms,
      gas_used || 0,
      gas_price_gwei || 0,
      cost_eth || 0,
      file_size_bytes || 0,
      tx_hash || "",
      block_number || 0,
      network || "localhost",
      JSON.stringify(metadata || {})
    );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/metrics — Get all metrics (with optional filters)
router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { operation, limit } = req.query;

    let query = "SELECT * FROM performance_metrics";
    const params = [];

    if (operation) {
      query += " WHERE operation = ?";
      params.push(operation);
    }

    query += " ORDER BY timestamp DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }

    const metrics = db.prepare(query).all(...params);
    res.json({ success: true, data: metrics, count: metrics.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/metrics/summary — Aggregated stats per operation type
router.get("/summary", (req, res) => {
  try {
    const db = getDb();
    const summary = db
      .prepare(`
        SELECT
          operation,
          COUNT(*) as count,
          ROUND(AVG(duration_ms), 2) as avg_duration_ms,
          ROUND(MIN(duration_ms), 2) as min_duration_ms,
          ROUND(MAX(duration_ms), 2) as max_duration_ms,
          ROUND(AVG(gas_used), 0) as avg_gas_used,
          ROUND(SUM(cost_eth), 6) as total_cost_eth,
          ROUND(AVG(file_size_bytes), 0) as avg_file_size
        FROM performance_metrics
        GROUP BY operation
        ORDER BY count DESC
      `)
      .all();

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/metrics/gas-report — Gas consumption breakdown
router.get("/gas-report", (req, res) => {
  try {
    const db = getDb();
    const report = db
      .prepare(`
        SELECT
          operation,
          COUNT(*) as tx_count,
          ROUND(AVG(gas_used), 0) as avg_gas,
          MIN(gas_used) as min_gas,
          MAX(gas_used) as max_gas,
          ROUND(AVG(gas_price_gwei), 2) as avg_gas_price_gwei,
          ROUND(SUM(cost_eth), 8) as total_cost_eth
        FROM performance_metrics
        WHERE gas_used > 0
        GROUP BY operation
        ORDER BY avg_gas DESC
      `)
      .all();

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/metrics/latency — Latency measurements for upload/download/grant/revoke
router.get("/latency", (req, res) => {
  try {
    const db = getDb();
    const latency = db
      .prepare(`
        SELECT
          operation,
          COUNT(*) as samples,
          ROUND(AVG(duration_ms), 2) as avg_latency_ms,
          ROUND(MIN(duration_ms), 2) as min_latency_ms,
          ROUND(MAX(duration_ms), 2) as max_latency_ms,
          ROUND(AVG(duration_ms) - MIN(duration_ms), 2) as jitter_ms
        FROM performance_metrics
        WHERE operation IN ('upload_record', 'download_record', 'grant_access', 'revoke_access', 'ipfs_upload', 'ipfs_download', 'encrypt_file', 'decrypt_file')
        GROUP BY operation
      `)
      .all();

    res.json({ success: true, data: latency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/metrics — Clear all metrics (for fresh benchmarks)
router.delete("/", (req, res) => {
  try {
    const db = getDb();
    db.prepare("DELETE FROM performance_metrics").run();
    res.json({ success: true, message: "All metrics cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
