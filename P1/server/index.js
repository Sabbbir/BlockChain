const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDatabase } = require("./db");
const userRoutes = require("./routes/users");
const metricsRoutes = require("./routes/metrics");
const auditRoutes = require("./routes/audit");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────────────

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// Request timing middleware — logs duration of every API call
app.use((req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`${req.method} ${req.path} — ${duration}ms [${res.statusCode}]`);
  });
  next();
});

// ─── Routes ────────────────────────────────────────────────────────

app.use("/api/users", userRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/audit", auditRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    },
    cpu: process.cpuUsage(),
  });
});

// ─── Start Server ──────────────────────────────────────────────────

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n🏥 Healthcare DApp API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Users:  http://localhost:${PORT}/api/users`);
    console.log(`   Metrics: http://localhost:${PORT}/api/metrics\n`);
  });
}

start().catch(console.error);

module.exports = app;
