const Database = require("better-sqlite3");
const path = require("path");

let db;

/**
 * Initialize SQLite database with required tables.
 * Uses better-sqlite3 for synchronous, fast operations.
 */
async function initDatabase() {
  const dbPath = path.join(__dirname, "healthcare.db");
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      email TEXT DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'HOSPITAL', 'DOCTOR', 'PATIENT')),
      organization TEXT DEFAULT '',
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      duration_ms REAL NOT NULL,
      gas_used INTEGER DEFAULT 0,
      gas_price_gwei REAL DEFAULT 0,
      cost_eth REAL DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      network TEXT DEFAULT 'localhost',
      metadata TEXT DEFAULT '{}',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_metrics_operation ON performance_metrics(operation);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON performance_metrics(timestamp);
  `);

  console.log("✅ Database initialized at:", dbPath);
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

module.exports = { initDatabase, getDb };
