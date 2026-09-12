/**
 * Performance Metrics Logger
 *
 * Utility to measure and report operation latency, gas costs, and other
 * metrics required for the assignment's performance evaluation section.
 *
 * All measurements use performance.now() for sub-millisecond accuracy.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Log a performance metric to the backend API.
 *
 * @param {Object} metric - The metric data.
 * @param {string} metric.operation - Name (e.g., "upload_record", "encrypt_file").
 * @param {number} metric.duration_ms - Duration in milliseconds.
 * @param {number} [metric.gas_used] - Gas consumed by the transaction.
 * @param {number} [metric.gas_price_gwei] - Gas price in Gwei.
 * @param {number} [metric.file_size_bytes] - File size in bytes.
 * @param {string} [metric.tx_hash] - Transaction hash.
 * @param {number} [metric.block_number] - Block number.
 * @param {Object} [metric.metadata] - Additional metadata.
 */
export async function logMetric(metric) {
  try {
    // Log to console for immediate visibility
    console.log(
      `📊 [${metric.operation}] ${metric.duration_ms.toFixed(2)}ms` +
        (metric.gas_used ? ` | Gas: ${metric.gas_used}` : "") +
        (metric.file_size_bytes ? ` | Size: ${formatBytes(metric.file_size_bytes)}` : "")
    );

    // Send to backend for storage and aggregation
    await fetch(`${API_BASE}/api/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...metric,
        network: detectNetwork(),
      }),
    });
  } catch (error) {
    // Don't let metrics logging break the main flow
    console.warn("Failed to log metric:", error.message);
  }
}

/**
 * Measure a blockchain transaction's gas cost and latency.
 *
 * @param {string} operation - The operation name.
 * @param {Function} txFn - Async function that returns a transaction.
 * @param {Object} [extraMetadata] - Additional data to log.
 * @returns {Promise<Object>} The transaction receipt with metrics.
 */
export async function measureTransaction(operation, txFn, extraMetadata = {}) {
  const startTime = performance.now();

  // Execute the transaction
  const tx = await txFn();
  const receipt = await tx.wait();

  const duration = performance.now() - startTime;

  // Calculate gas cost
  const gasUsed = Number(receipt.gasUsed);
  const gasPrice = receipt.gasPrice ? Number(receipt.gasPrice) : 0;
  const costWei = gasUsed * gasPrice;
  const costEth = costWei / 1e18;

  // Log the metric
  await logMetric({
    operation,
    duration_ms: duration,
    gas_used: gasUsed,
    gas_price_gwei: gasPrice / 1e9,
    cost_eth: costEth,
    tx_hash: receipt.hash,
    block_number: receipt.blockNumber,
    metadata: extraMetadata,
  });

  return {
    receipt,
    metrics: {
      duration_ms: duration,
      gas_used: gasUsed,
      gas_price_gwei: gasPrice / 1e9,
      cost_eth: costEth,
    },
  };
}

/**
 * Measure the duration of a non-transaction operation (e.g., encryption).
 *
 * @param {string} operation - The operation name.
 * @param {Function} fn - Async function to measure.
 * @param {Object} [extraMetadata] - Additional data to log.
 * @returns {Promise<Object>} The function's return value with timing.
 */
export async function measureOperation(operation, fn, extraMetadata = {}) {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  await logMetric({
    operation,
    duration_ms: duration,
    ...extraMetadata,
  });

  return { result, duration_ms: duration };
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function detectNetwork() {
  if (typeof window === "undefined") return "server";
  if (window.ethereum?.chainId === "0x7a69") return "localhost";
  if (window.ethereum?.chainId === "0xaa36a7") return "sepolia";
  return "unknown";
}
