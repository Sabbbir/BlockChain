"use client";

import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { measureTransaction } from "../lib/metrics";

export default function RoleRegistration() {
  const { account, roleManager, fetchRole, shortAddress, disconnectWallet } =
    useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [hospitalAddress, setHospitalAddress] = useState("");

  const registerAsPatient = async () => {
    setIsLoading(true);
    setTxStatus("Submitting transaction...");
    try {
      const { receipt, metrics } = await measureTransaction(
        "register_patient",
        () => roleManager.registerPatient()
      );
      setTxStatus(
        `✅ Registered! Gas: ${metrics.gas_used} | ${metrics.duration_ms.toFixed(0)}ms`
      );
      await fetchRole();
    } catch (err) {
      setTxStatus(`❌ ${err.reason || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHospitalRegistration = async () => {
    setIsLoading(true);
    setTxStatus("Submitting hospital registration request...");
    try {
      const { receipt, metrics } = await measureTransaction(
        "request_hospital_registration",
        () => roleManager.requestHospitalRegistration()
      );
      setTxStatus(
        `✅ Request submitted! Awaiting admin approval. Gas: ${metrics.gas_used}`
      );
    } catch (err) {
      setTxStatus(`❌ ${err.reason || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient-bg flex flex-col">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MedChain</span>
        </div>
        <button onClick={disconnectWallet} className="btn-secondary text-sm">
          Disconnect
        </button>
      </nav>

      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-2xl w-full animate-slide-up">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Welcome to MedChain</h1>
            <p className="text-surface-200/50">
              Connected as{" "}
              <span className="font-mono text-primary-400">{shortAddress}</span>
              . Choose your role to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Registration */}
            <div className="glass-card-hover p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Patient</h2>
              <p className="text-sm text-surface-200/50 mb-6">
                Upload, manage, and share your medical records securely. Grant
                or revoke access to doctors.
              </p>
              <button
                onClick={registerAsPatient}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Processing..." : "Register as Patient"}
              </button>
            </div>

            {/* Hospital Registration */}
            <div className="glass-card-hover p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Hospital</h2>
              <p className="text-sm text-surface-200/50 mb-6">
                Request registration to manage doctors. Requires admin approval
                before activation.
              </p>
              <button
                onClick={requestHospitalRegistration}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Processing..." : "Request Hospital Registration"}
              </button>
            </div>
          </div>

          {/* Status message */}
          {txStatus && (
            <div className="mt-6 p-4 glass-card text-center text-sm animate-fade-in">
              {txStatus}
            </div>
          )}

          <p className="text-center text-xs text-surface-200/30 mt-8">
            Doctors are registered by approved hospitals. Admins are set during
            contract deployment.
          </p>
        </div>
      </main>
    </div>
  );
}
