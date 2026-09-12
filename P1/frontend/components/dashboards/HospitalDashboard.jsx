"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../contexts/Web3Context";
import DashboardLayout from "./DashboardLayout";
import { measureTransaction } from "../../lib/metrics";

const TABS = [
  { id: "doctors", label: "🩺 Manage Doctors" },
  { id: "stats", label: "📊 Statistics" },
];

export default function HospitalDashboard() {
  const [activeTab, setActiveTab] = useState("doctors");

  return (
    <DashboardLayout
      title="Hospital Dashboard"
      icon="🏨"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "doctors" && <ManageDoctors />}
      {activeTab === "stats" && <HospitalStats />}
    </DashboardLayout>
  );
}

// ─── Manage Doctors ─────────────────────────────────────────────────

function ManageDoctors() {
  const { account, roleManager } = useWeb3();
  const [doctors, setDoctors] = useState([]);
  const [doctorAddress, setDoctorAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  const loadDoctors = useCallback(async () => {
    try {
      const DOCTOR_ROLE = await roleManager.DOCTOR_ROLE();
      const allDoctors = await roleManager.getRoleMembers(DOCTOR_ROLE);

      // Filter to only doctors registered by this hospital
      const myDoctors = [];
      for (const doc of allDoctors) {
        const hospital = await roleManager.doctorToHospital(doc);
        if (hospital.toLowerCase() === account.toLowerCase()) {
          myDoctors.push(doc);
        }
      }
      setDoctors(myDoctors);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  }, [roleManager, account]);

  useEffect(() => {
    if (roleManager && account) loadDoctors();
  }, [roleManager, account, loadDoctors]);

  const registerDoctor = async () => {
    if (!doctorAddress) return;
    setActionStatus("Registering doctor...");
    try {
      const { metrics } = await measureTransaction(
        "register_doctor",
        () => roleManager.registerDoctor(doctorAddress)
      );
      setActionStatus(
        `✅ Doctor registered! Gas: ${metrics.gas_used} | ${metrics.duration_ms.toFixed(0)}ms`
      );
      setDoctorAddress("");
      await loadDoctors();
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
      {/* Register New Doctor */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Register New Doctor</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={doctorAddress}
            onChange={(e) => setDoctorAddress(e.target.value)}
            placeholder="Doctor's wallet address (0x...)"
            className="input-field flex-1 font-mono text-sm"
          />
          <button
            onClick={registerDoctor}
            disabled={!doctorAddress}
            className="btn-accent shrink-0"
          >
            Register Doctor
          </button>
        </div>
      </div>

      {/* Status */}
      {actionStatus && (
        <div className="p-3 glass-card text-sm text-center animate-fade-in">
          {actionStatus}
        </div>
      )}

      {/* Registered Doctors */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">
          Your Doctors ({doctors.length})
        </h3>
        {doctors.length === 0 ? (
          <p className="text-surface-200/40 text-sm">
            No doctors registered yet. Use the form above to register doctors.
          </p>
        ) : (
          <div className="space-y-3">
            {doctors.map((doc) => (
              <div
                key={doc}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 border border-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center text-lg">
                  🩺
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm">{doc}</p>
                </div>
                <span className="badge badge-doctor">Doctor</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hospital Stats ─────────────────────────────────────────────────

function HospitalStats() {
  const { account, roleManager } = useWeb3();
  const [stats, setStats] = useState({ doctors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const DOCTOR_ROLE = await roleManager.DOCTOR_ROLE();
        const allDoctors = await roleManager.getRoleMembers(DOCTOR_ROLE);

        let myCount = 0;
        for (const doc of allDoctors) {
          const hospital = await roleManager.doctorToHospital(doc);
          if (hospital.toLowerCase() === account.toLowerCase()) myCount++;
        }

        setStats({ doctors: myCount });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (roleManager && account) load();
  }, [roleManager, account]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="stat-card">
        <div className="stat-value text-accent-400">{stats.doctors}</div>
        <div className="stat-label">Registered Doctors</div>
      </div>
      <div className="stat-card">
        <div className="stat-value text-primary-400">
          {account.slice(0, 10)}...
        </div>
        <div className="stat-label">Hospital Address</div>
      </div>
      <div className="stat-card">
        <div className="stat-value text-amber-400">Active</div>
        <div className="stat-label">Status</div>
      </div>
    </div>
  );
}
