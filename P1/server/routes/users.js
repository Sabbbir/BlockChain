const express = require("express");
const router = express.Router();
const { getDb } = require("../db");

/**
 * User Routes — Manages off-chain user profiles (non-sensitive data).
 * The blockchain stores roles/permissions; this stores display names, emails, etc.
 */

// GET /api/users — List all users (with optional role filter)
router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { role } = req.query;

    let users;
    if (role) {
      users = db.prepare("SELECT * FROM users WHERE role = ? ORDER BY registered_at DESC").all(role.toUpperCase());
    } else {
      users = db.prepare("SELECT * FROM users ORDER BY registered_at DESC").all();
    }

    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/:walletAddress — Get user by wallet address
router.get("/:walletAddress", (req, res) => {
  try {
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE wallet_address = ?")
      .get(req.params.walletAddress.toLowerCase());

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users — Register or update a user profile
router.post("/", (req, res) => {
  try {
    const db = getDb();
    const { wallet_address, name, email, role, organization } = req.body;

    if (!wallet_address || !role) {
      return res.status(400).json({
        success: false,
        error: "wallet_address and role are required",
      });
    }

    const validRoles = ["ADMIN", "HOSPITAL", "DOCTOR", "PATIENT"];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Upsert: insert or update on conflict
    const stmt = db.prepare(`
      INSERT INTO users (wallet_address, name, email, role, organization)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(wallet_address) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        organization = excluded.organization,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(
      wallet_address.toLowerCase(),
      name || "",
      email || "",
      role.toUpperCase(),
      organization || ""
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, wallet_address, name, role },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:walletAddress — Remove a user profile
router.delete("/:walletAddress", (req, res) => {
  try {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM users WHERE wallet_address = ?")
      .run(req.params.walletAddress.toLowerCase());

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/stats/summary — Get user count by role
router.get("/stats/summary", (req, res) => {
  try {
    const db = getDb();
    const stats = db
      .prepare("SELECT role, COUNT(*) as count FROM users GROUP BY role")
      .all();

    const summary = { ADMIN: 0, HOSPITAL: 0, DOCTOR: 0, PATIENT: 0 };
    stats.forEach((s) => (summary[s.role] = s.count));

    res.json({ success: true, data: summary, total: Object.values(summary).reduce((a, b) => a + b, 0) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
