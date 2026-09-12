"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../contexts/Web3Context";
import DashboardLayout from "./DashboardLayout";
import { measureTransaction } from "../../lib/metrics";

const TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "hospitals", label: "🏨 Hospitals" },
  { id: "users", label: "👥 All Users" },
  { id: "metrics", label: "⚡ Performance" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout
      title="Administrator Dashboard"
      icon="⚙️"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && <SystemOverview />}
      {activeTab === "hospitals" && <ManageHospitals />}
      {activeTab === "users" && <AllUsers />}
      {activeTab === "metrics" && <PerformanceMetrics />}
    </DashboardLayout>
  );
}

// ─── System Overview ────────────────────────────────────────────────

function SystemOverview() {
  const { roleManager, medicalRecord } = useWeb3();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [admins, hospitals, doctors, patients] =
          await roleManager.getSystemStats();
        const totalRecords = await medicalRecord.totalRecords();
        const totalGrants = await medicalRecord.totalAccessGrants();

        setStats({
          admins: Number(admins),
          hospitals: Number(hospitals),
          doctors: Number(doctors),
          patients: Number(patients),
          totalRecords: Number(totalRecords),
          totalGrants: Number(totalGrants),
          totalUsers:
            Number(admins) +
            Number(hospitals) +
            Number(doctors) +
            Number(patients),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (roleManager && medicalRecord) load();
  }, [roleManager, medicalRecord]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.totalUsers} label="Total Users" color="text-white" />
        <StatCard value={stats.patients} label="Patients" color="text-amber-400" />
        <StatCard value={stats.doctors} label="Doctors" color="text-accent-400" />
        <StatCard value={stats.hospitals} label="Hospitals" color="text-blue-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard value={stats.admins} label="Admins" color="text-purple-400" />
        <StatCard value={stats.totalRecords} label="Records Uploaded" color="text-primary-400" />
        <StatCard value={stats.totalGrants} label="Access Grants" color="text-accent-400" />
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Network" value="Hardhat Local / Sepolia" />
          <InfoRow label="Architecture" value="Hybrid (Blockchain + IPFS + SQLite)" />
          <InfoRow label="Encryption" value="AES-256-GCM (Client-Side)" />
          <InfoRow label="Smart Contracts" value="3 (RoleManager, MedicalRecord, AuditLogger)" />
        </div>
      </div>
    </div>
  );
}

// ─── Manage Hospitals ───────────────────────────────────────────────

function ManageHospitals() {
  const { roleManager } = useWeb3();
  const [pendingAddress, setPendingAddress] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  const loadHospitals = useCallback(async () => {
    try {
      const HOSPITAL_ROLE = await roleManager.HOSPITAL_ROLE();
      const hosp = await roleManager.getRoleMembers(HOSPITAL_ROLE);
      setHospitals([...hosp]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roleManager]);

  useEffect(() => {
    if (roleManager) loadHospitals();
  }, [roleManager, loadHospitals]);

  const approveHospital = async (address) => {
    setActionStatus(`Approving hospital ${address.slice(0, 10)}...`);
    try {
      const { metrics } = await measureTransaction(
        "approve_hospital",
        () => roleManager.approveHospital(address)
      );
      setActionStatus(
        `✅ Hospital approved! Gas: ${metrics.gas_used} | ${metrics.duration_ms.toFixed(0)}ms`
      );
      await loadHospitals();
    } catch (err) {
      setActionStatus(`❌ ${err.reason || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Approve Hospital */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Approve Pending Hospital</h3>
        <p className="text-sm text-surface-200/40 mb-4">
          Enter the address of a hospital that has requested registration.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={pendingAddress}
            onChange={(e) => setPendingAddress(e.target.value)}
            placeholder="Hospital wallet address (0x...)"
            className="input-field flex-1 font-mono text-sm"
          />
          <button
            onClick={() => approveHospital(pendingAddress)}
            disabled={!pendingAddress}
            className="btn-accent shrink-0"
          >
            Approve Hospital
          </button>
        </div>
      </div>

      {/* Status */}
      {actionStatus && (
        <div className="p-3 glass-card text-sm text-center animate-fade-in">
          {actionStatus}
        </div>
      )}

      {/* Approved Hospitals */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">
          Approved Hospitals ({hospitals.length})
        </h3>
        {hospitals.length === 0 ? (
          <p className="text-surface-200/40 text-sm">
            No hospitals approved yet.
          </p>
        ) : (
          <div className="space-y-3">
            {hospitals.map((hosp) => (
              <div
                key={hosp}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg">
                  🏨
                </div>
                <p className="font-mono text-sm flex-1">{hosp}</p>
                <span className="badge badge-hospital">Approved</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── All Users ──────────────────────────────────────────────────────

function AllUsers() {
  const { roleManager } = useWeb3();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const allUsers = [];
        const roles = [
          { key: await roleManager.DEFAULT_ADMIN_ROLE(), name: "ADMIN" },
          { key: await roleManager.HOSPITAL_ROLE(), name: "HOSPITAL" },
          { key: await roleManager.DOCTOR_ROLE(), name: "DOCTOR" },
          { key: await roleManager.PATIENT_ROLE(), name: "PATIENT" },
        ];

        for (const role of roles) {
          const members = await roleManager.getRoleMembers(role.key);
          members.forEach((addr) => {
            allUsers.push({ address: addr, role: role.name });
          });
        }

        setUsers(allUsers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (roleManager) load();
  }, [roleManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-white/5">
        <h3 className="font-semibold">All Registered Users ({users.length})</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={idx}>
              <td className="font-mono text-sm">{user.address}</td>
              <td>
                <span
                  className={`badge ${
                    user.role === "ADMIN"
                      ? "badge-admin"
                      : user.role === "HOSPITAL"
                      ? "badge-hospital"
                      : user.role === "DOCTOR"
                      ? "badge-doctor"
                      : "badge-patient"
                  }`}
                >
                  {user.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Performance Metrics ────────────────────────────────────────────

function PerformanceMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, summaryRes] = await Promise.all([
          fetch("http://localhost:3001/api/metrics?limit=50").then((r) => r.json()),
          fetch("http://localhost:3001/api/metrics/summary").then((r) => r.json()),
        ]);
        setMetrics(metricsRes.data || []);
        setSummary(summaryRes.data || []);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      {summary.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Operation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((s) => (
              <div key={s.operation} className="glass-card p-5">
                <p className="text-sm font-semibold text-primary-300 mb-3">
                  {s.operation}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-surface-200/40">Avg Latency</p>
                    <p className="font-semibold">{s.avg_duration_ms}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-200/40">Count</p>
                    <p className="font-semibold">{s.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-200/40">Avg Gas</p>
                    <p className="font-semibold">
                      {s.avg_gas_used ? Number(s.avg_gas_used).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-200/40">Total Cost</p>
                    <p className="font-semibold">
                      {s.total_cost_eth ? `${s.total_cost_eth} ETH` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Metrics Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold">
            Recent Operations ({metrics.length})
          </h3>
        </div>
        {metrics.length === 0 ? (
          <div className="p-8 text-center text-surface-200/40 text-sm">
            No metrics recorded yet. Perform operations to see data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Duration</th>
                  <th>Gas Used</th>
                  <th>Cost (ETH)</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-primary-300">
                      {m.operation}
                    </td>
                    <td>{m.duration_ms.toFixed(1)}ms</td>
                    <td>{m.gas_used ? m.gas_used.toLocaleString() : "-"}</td>
                    <td className="font-mono text-xs">
                      {m.cost_eth ? m.cost_eth.toFixed(6) : "-"}
                    </td>
                    <td className="text-xs text-surface-200/40">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-800/30">
      <span className="text-sm text-surface-200/50">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
