"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../contexts/Web3Context";
import DashboardLayout from "./DashboardLayout";
import { generateEncryptionKey, exportKey, encryptFile } from "../../lib/encryption";
import { uploadToIPFS, isUsingMockIPFS } from "../../lib/ipfs";
import { measureTransaction, logMetric } from "../../lib/metrics";

const TABS = [
  { id: "records", label: "📁 My Records" },
  { id: "upload", label: "⬆️ Upload" },
  { id: "access", label: "🔑 Manage Access" },
  { id: "audit", label: "📋 Audit Log" },
];

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("records");

  return (
    <DashboardLayout
      title="Patient Dashboard"
      icon="🏥"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "records" && <MyRecords />}
      {activeTab === "upload" && <UploadRecord />}
      {activeTab === "access" && <ManageAccess />}
      {activeTab === "audit" && <AuditLog />}
    </DashboardLayout>
  );
}

// ─── My Records Tab ─────────────────────────────────────────────────

function MyRecords() {
  const { account, medicalRecord } = useWeb3();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const recs = await medicalRecord.getRecords.staticCall(account);
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
        console.error("Failed to load records:", err);
      } finally {
        setLoading(false);
      }
    }
    if (medicalRecord && account) load();
  }, [medicalRecord, account]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (records.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold mb-2">No Records Yet</h3>
        <p className="text-surface-200/50">
          Upload your first medical record using the Upload tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Medical History ({records.length} records)
        </h2>
      </div>
      {records.map((record, idx) => (
        <div
          key={idx}
          className="glass-card-hover p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-lg shrink-0">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{record.fileName}</p>
            <p className="text-xs text-surface-200/40 font-mono truncate">
              CID: {record.ipfsHash}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-surface-200/40">
              {new Date(record.timestamp * 1000).toLocaleDateString()}
            </p>
            <p className="text-xs text-surface-200/30">
              {new Date(record.timestamp * 1000).toLocaleTimeString()}
            </p>
          </div>
          <span
            className={`badge ${
              record.isActive
                ? "bg-accent-500/20 text-accent-300 border-accent-500/30"
                : "bg-red-500/20 text-red-300 border-red-500/30"
            }`}
          >
            {record.isActive ? "Active" : "Archived"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Upload Record Tab ──────────────────────────────────────────────

function UploadRecord() {
  const { medicalRecord } = useWeb3();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    try {
      // Step 1: Generate AES-256 encryption key
      setProgress("🔑 Generating encryption key...");
      const key = await generateEncryptionKey();
      const keyBase64 = await exportKey(key);
      setEncryptionKey(keyBase64);

      // Step 2: Encrypt file in browser
      setProgress("🔐 Encrypting file...");
      const encResult = await encryptFile(file, key);
      await logMetric({
        operation: "encrypt_file",
        duration_ms: encResult.timeTaken,
        file_size_bytes: encResult.originalSize,
      });

      // Step 3: Upload encrypted file to IPFS
      setProgress("🌐 Uploading to IPFS...");
      const ipfsResult = await uploadToIPFS(encResult.encryptedBlob, file.name);
      await logMetric({
        operation: "ipfs_upload",
        duration_ms: ipfsResult.timeTaken,
        file_size_bytes: ipfsResult.size,
      });

      // Step 4: Store CID on blockchain
      setProgress("⛓️ Recording on blockchain...");
      const { metrics } = await measureTransaction(
        "upload_record",
        () => medicalRecord.uploadRecord(ipfsResult.cid, file.name),
        { file_size_bytes: file.size }
      );

      setResult({
        success: true,
        cid: ipfsResult.cid,
        encryptionTime: encResult.timeTaken,
        uploadTime: ipfsResult.timeTaken,
        gasUsed: metrics.gas_used,
        totalTime: encResult.timeTaken + ipfsResult.timeTaken + metrics.duration_ms,
      });
      setProgress("");
    } catch (err) {
      setResult({ success: false, error: err.reason || err.message });
      setProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold mb-6">Upload Medical Record</h2>

        {isUsingMockIPFS() && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
            ⚠️ Running in mock IPFS mode. Set PINATA_JWT for real IPFS uploads.
          </div>
        )}

        {/* File Drop Zone */}
        <label
          className={`block w-full p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 mb-6 ${
            file
              ? "border-primary-500/50 bg-primary-500/5"
              : "border-white/10 hover:border-primary-500/30 hover:bg-white/[0.02]"
          }`}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.dicom,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={isUploading}
          />
          {file ? (
            <div>
              <div className="text-3xl mb-2">📄</div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-surface-200/40">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-3">📂</div>
              <p className="font-medium mb-1">Drop file here or click to browse</p>
              <p className="text-sm text-surface-200/40">
                PDF, Images, DICOM, Documents (encrypted before upload)
              </p>
            </div>
          )}
        </label>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="btn-accent w-full text-lg py-4"
        >
          {isUploading ? progress : "🔐 Encrypt & Upload"}
        </button>

        {/* Result */}
        {result && (
          <div
            className={`mt-6 p-5 rounded-xl border animate-slide-up ${
              result.success
                ? "bg-accent-500/10 border-accent-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            {result.success ? (
              <div className="space-y-3">
                <p className="font-semibold text-accent-300">
                  ✅ Record uploaded successfully!
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetricItem label="IPFS CID" value={result.cid} mono />
                  <MetricItem
                    label="Encryption"
                    value={`${result.encryptionTime.toFixed(1)}ms`}
                  />
                  <MetricItem
                    label="IPFS Upload"
                    value={`${result.uploadTime.toFixed(1)}ms`}
                  />
                  <MetricItem
                    label="Gas Used"
                    value={result.gasUsed.toLocaleString()}
                  />
                  <MetricItem
                    label="Total Time"
                    value={`${result.totalTime.toFixed(0)}ms`}
                  />
                </div>
                {encryptionKey && (
                  <div className="mt-3 p-3 bg-surface-900/80 rounded-lg">
                    <p className="text-xs text-amber-300 font-semibold mb-1">
                      🔑 Encryption Key (save securely!)
                    </p>
                    <p className="text-xs font-mono text-surface-200/60 break-all select-all">
                      {encryptionKey}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-300">❌ {result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manage Access Tab ──────────────────────────────────────────────

function ManageAccess() {
  const { account, medicalRecord, roleManager } = useWeb3();
  const [accessList, setAccessList] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorAddress, setDoctorAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const list = await medicalRecord.getAccessList(account);
      setAccessList([...list]);

      const DOCTOR_ROLE = await roleManager.DOCTOR_ROLE();
      const doctors = await roleManager.getRoleMembers(DOCTOR_ROLE);
      setAllDoctors([...doctors]);
    } catch (err) {
      console.error("Failed to load access data:", err);
    } finally {
      setLoading(false);
    }
  }, [account, medicalRecord, roleManager]);

  useEffect(() => {
    if (medicalRecord && roleManager && account) loadData();
  }, [medicalRecord, roleManager, account, loadData]);

  const grantAccess = async (doctor) => {
    setActionStatus(`Granting access to ${doctor.slice(0, 8)}...`);
    try {
      const { metrics } = await measureTransaction(
        "grant_access",
        () => medicalRecord.grantAccess(doctor)
      );
      setActionStatus(
        `✅ Access granted! Gas: ${metrics.gas_used} | ${metrics.duration_ms.toFixed(0)}ms`
      );
      await loadData();
    } catch (err) {
      setActionStatus(`❌ ${err.reason || err.message}`);
    }
  };

  const revokeAccess = async (doctor) => {
    setActionStatus(`Revoking access from ${doctor.slice(0, 8)}...`);
    try {
      const { metrics } = await measureTransaction(
        "revoke_access",
        () => medicalRecord.revokeAccess(doctor)
      );
      setActionStatus(
        `✅ Access revoked! Gas: ${metrics.gas_used} | ${metrics.duration_ms.toFixed(0)}ms`
      );
      await loadData();
    } catch (err) {
      setActionStatus(`❌ ${err.reason || err.message}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Grant */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Grant Access to Doctor</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={doctorAddress}
            onChange={(e) => setDoctorAddress(e.target.value)}
            placeholder="Enter doctor's wallet address (0x...)"
            className="input-field flex-1 font-mono text-sm"
          />
          <button
            onClick={() => grantAccess(doctorAddress)}
            disabled={!doctorAddress}
            className="btn-accent shrink-0"
          >
            Grant Access
          </button>
        </div>
      </div>

      {/* Status */}
      {actionStatus && (
        <div className="p-3 glass-card text-sm text-center animate-fade-in">
          {actionStatus}
        </div>
      )}

      {/* Current Access List */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">
          Active Access ({accessList.length} doctors)
        </h3>
        {accessList.length === 0 ? (
          <p className="text-surface-200/40 text-sm">
            No doctors have access to your records.
          </p>
        ) : (
          <div className="space-y-3">
            {accessList.map((doctor) => (
              <div
                key={doctor}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center">
                    🩺
                  </div>
                  <span className="font-mono text-sm">{doctor}</span>
                </div>
                <button
                  onClick={() => revokeAccess(doctor)}
                  className="btn-danger text-sm px-4 py-2"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Doctors */}
      {allDoctors.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Registered Doctors</h3>
          <div className="space-y-2">
            {allDoctors.map((doctor) => {
              const hasAccess = accessList.includes(doctor);
              return (
                <div
                  key={doctor}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30"
                >
                  <span className="font-mono text-sm text-surface-200/60">
                    {doctor}
                  </span>
                  {hasAccess ? (
                    <span className="badge bg-accent-500/20 text-accent-300 border-accent-500/30">
                      ✓ Granted
                    </span>
                  ) : (
                    <button
                      onClick={() => grantAccess(doctor)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Grant
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ──────────────────────────────────────────────────

function AuditLog() {
  const { account, auditLogger } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const allEvents = [];

        // Fetch RecordUploaded events for this patient
        const uploadFilter = auditLogger.filters.RecordUploaded(account);
        const uploadEvents = await auditLogger.queryFilter(uploadFilter, 0, "latest");
        uploadEvents.forEach((e) => {
          allEvents.push({
            type: "Upload",
            icon: "⬆️",
            description: `Uploaded ${e.args[2]}`,
            hash: e.args[1],
            timestamp: Number(e.args[3]),
            txHash: e.transactionHash,
          });
        });

        // Fetch AccessGranted events
        const grantFilter = auditLogger.filters.AccessGranted(account);
        const grantEvents = await auditLogger.queryFilter(grantFilter, 0, "latest");
        grantEvents.forEach((e) => {
          allEvents.push({
            type: "Grant",
            icon: "🔓",
            description: `Granted access to ${e.args[1].slice(0, 10)}...`,
            timestamp: Number(e.args[2]),
            txHash: e.transactionHash,
          });
        });

        // Fetch AccessRevoked events
        const revokeFilter = auditLogger.filters.AccessRevoked(account);
        const revokeEvents = await auditLogger.queryFilter(revokeFilter, 0, "latest");
        revokeEvents.forEach((e) => {
          allEvents.push({
            type: "Revoke",
            icon: "🔒",
            description: `Revoked access from ${e.args[1].slice(0, 10)}...`,
            timestamp: Number(e.args[2]),
            txHash: e.transactionHash,
          });
        });

        // Fetch RecordAccessed events
        const accessFilter = auditLogger.filters.RecordAccessed(account);
        const accessEvents = await auditLogger.queryFilter(accessFilter, 0, "latest");
        accessEvents.forEach((e) => {
          allEvents.push({
            type: "Accessed",
            icon: "👁️",
            description: `Records accessed by ${e.args[1].slice(0, 10)}...`,
            timestamp: Number(e.args[3]),
            txHash: e.transactionHash,
          });
        });

        // Sort by timestamp descending
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold">
            Audit Trail ({events.length} events)
          </h3>
          <p className="text-xs text-surface-200/40 mt-1">
            Immutable record of all actions — stored on blockchain
          </p>
        </div>
        {events.length === 0 ? (
          <div className="p-8 text-center text-surface-200/40 text-sm">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-2xl">{event.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.description}</p>
                  <p className="text-xs text-surface-200/30 font-mono truncate">
                    Tx: {event.txHash}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`badge text-xs ${
                      event.type === "Upload"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : event.type === "Grant"
                        ? "bg-accent-500/20 text-accent-300 border-accent-500/30"
                        : event.type === "Revoke"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {event.type}
                  </span>
                  <p className="text-xs text-surface-200/30 mt-1">
                    {new Date(event.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────

function MetricItem({ label, value, mono }) {
  return (
    <div className="p-2 rounded-lg bg-surface-900/50">
      <p className="text-xs text-surface-200/40 mb-0.5">{label}</p>
      <p
        className={`text-sm font-semibold truncate ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
