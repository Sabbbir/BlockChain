"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "../../contexts/Web3Context";
import DashboardLayout from "./DashboardLayout";
import { importKey, decryptFile } from "../../lib/encryption";
import { downloadFromIPFS } from "../../lib/ipfs";
import { logMetric } from "../../lib/metrics";

const TABS = [
  { id: "patients", label: "👥 My Patients" },
  { id: "records", label: "📁 View Records" },
  { id: "audit", label: "📋 Audit Log" },
];

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("patients");

  return (
    <DashboardLayout
      title="Doctor Dashboard"
      icon="🩺"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "patients" && <MyPatients />}
      {activeTab === "records" && <ViewRecords />}
      {activeTab === "audit" && <DoctorAuditLog />}
    </DashboardLayout>
  );
}

// ─── My Patients ────────────────────────────────────────────────────

function MyPatients() {
  const { account, medicalRecord } = useWeb3();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const pts = await medicalRecord.getPatientsForDoctor(account);
        setPatients([...pts]);
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setLoading(false);
      }
    }
    if (medicalRecord && account) load();
  }, [medicalRecord, account]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="text-5xl mb-4">👥</div>
        <h3 className="text-xl font-bold mb-2">No Patients Yet</h3>
        <p className="text-surface-200/50">
          Patients must grant you access from their dashboard for you to see
          their records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-semibold mb-2">
        Patients Who Granted Access ({patients.length})
      </h2>
      {patients.map((patient) => (
        <div
          key={patient}
          className="glass-card-hover p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">
            🧑
          </div>
          <div className="flex-1">
            <p className="font-mono text-sm">{patient}</p>
            <p className="text-xs text-surface-200/30">Patient</p>
          </div>
          <span className="badge bg-accent-500/20 text-accent-300 border-accent-500/30">
            Access Granted
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── View Records ───────────────────────────────────────────────────

function ViewRecords() {
  const { account, medicalRecord } = useWeb3();
  const [patientAddress, setPatientAddress] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [decryptedFile, setDecryptedFile] = useState(null);

  const fetchRecords = async () => {
    if (!patientAddress) return;
    setLoading(true);
    setError(null);
    setRecords([]);

    try {
      const startTime = performance.now();
      const recs = await medicalRecord.getRecords(patientAddress);
      const duration = performance.now() - startTime;

      await logMetric({
        operation: "fetch_records",
        duration_ms: duration,
      });

      setRecords(
        recs.map((r) => ({
          ipfsHash: r.ipfsHash,
          fileName: r.fileName,
          owner: r.owner,
          timestamp: Number(r.timestamp),
          isActive: r.isActive,
        }))
      );
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadAndDecrypt = async (record) => {
    if (!decryptionKey) {
      setError("Please enter the decryption key");
      return;
    }

    try {
      setError(null);

      // Download from IPFS
      const ipfsResult = await downloadFromIPFS(record.ipfsHash);
      await logMetric({
        operation: "ipfs_download",
        duration_ms: ipfsResult.timeTaken,
        file_size_bytes: ipfsResult.size,
      });

      // Decrypt
      const key = await importKey(decryptionKey);
      const decResult = await decryptFile(ipfsResult.data, key);
      await logMetric({
        operation: "decrypt_file",
        duration_ms: decResult.timeTaken,
        file_size_bytes: decResult.decryptedSize,
      });

      // Create download URL
      const url = URL.createObjectURL(decResult.decryptedBlob);
      setDecryptedFile({ url, name: record.fileName });
    } catch (err) {
      setError(`Decryption failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient Address Input */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">View Patient Records</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            placeholder="Patient wallet address (0x...)"
            className="input-field flex-1 font-mono text-sm"
          />
          <button
            onClick={fetchRecords}
            disabled={!patientAddress || loading}
            className="btn-primary shrink-0"
          >
            {loading ? "Loading..." : "Fetch Records"}
          </button>
        </div>
      </div>

      {/* Decryption Key */}
      {records.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3">Decryption Key</h3>
          <input
            type="text"
            value={decryptionKey}
            onChange={(e) => setDecryptionKey(e.target.value)}
            placeholder="Paste the patient's encryption key (base64)"
            className="input-field font-mono text-sm"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
          ❌ {error}
        </div>
      )}

      {/* Records */}
      {records.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold">
              Records ({records.length})
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {records.map((record, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-2xl">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{record.fileName}</p>
                  <p className="text-xs text-surface-200/30 font-mono truncate">
                    {record.ipfsHash}
                  </p>
                </div>
                <p className="text-xs text-surface-200/40 shrink-0">
                  {new Date(record.timestamp * 1000).toLocaleDateString()}
                </p>
                <button
                  onClick={() => downloadAndDecrypt(record)}
                  disabled={!decryptionKey}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  🔓 Decrypt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decrypted File Download */}
      {decryptedFile && (
        <div className="glass-card p-6 text-center animate-slide-up">
          <p className="text-accent-300 font-semibold mb-3">
            ✅ File decrypted successfully!
          </p>
          <a
            href={decryptedFile.url}
            download={decryptedFile.name}
            className="btn-accent inline-block"
          >
            ⬇️ Download {decryptedFile.name}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Doctor Audit Log ───────────────────────────────────────────────

function DoctorAuditLog() {
  const { account, auditLogger } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const allEvents = [];

        // Records accessed by this doctor
        const accessFilter = auditLogger.filters.RecordAccessed(null, account);
        const accessEvents = await auditLogger.queryFilter(accessFilter, 0, "latest");
        accessEvents.forEach((e) => {
          allEvents.push({
            type: "Accessed",
            icon: "👁️",
            description: `Accessed records of ${e.args[0].slice(0, 10)}...`,
            timestamp: Number(e.args[3]),
            txHash: e.transactionHash,
          });
        });

        // Access grants to this doctor
        const grantFilter = auditLogger.filters.AccessGranted(null, account);
        const grantEvents = await auditLogger.queryFilter(grantFilter, 0, "latest");
        grantEvents.forEach((e) => {
          allEvents.push({
            type: "Granted",
            icon: "🔓",
            description: `${e.args[0].slice(0, 10)}... granted you access`,
            timestamp: Number(e.args[2]),
            txHash: e.transactionHash,
          });
        });

        allEvents.sort((a, b) => b.timestamp - a.timestamp);
        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to load audit events:", err);
      } finally {
        setLoading(false);
      }
    }
    if (auditLogger && account) loadEvents();
  }, [auditLogger, account]);

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
        <h3 className="font-semibold">Your Activity Log ({events.length} events)</h3>
      </div>
      {events.length === 0 ? (
        <div className="p-8 text-center text-surface-200/40 text-sm">
          No activity recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {events.map((event, idx) => (
            <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02]">
              <div className="text-2xl">{event.icon}</div>
              <div className="flex-1">
                <p className="text-sm">{event.description}</p>
                <p className="text-xs text-surface-200/30 font-mono truncate">
                  Tx: {event.txHash}
                </p>
              </div>
              <span className={`badge text-xs ${
                event.type === "Granted"
                  ? "bg-accent-500/20 text-accent-300 border-accent-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                {event.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
