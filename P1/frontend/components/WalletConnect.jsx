"use client";

import { useWeb3 } from "../contexts/Web3Context";

export default function WalletConnect({ large = false }) {
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    shortAddress,
    role,
    chainId,
    error,
  } = useWeb3();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {/* Network indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div
            className={`w-2 h-2 rounded-full ${
              chainId === 31337
                ? "bg-accent-400"
                : chainId === 11155111
                ? "bg-blue-400"
                : "bg-amber-400"
            }`}
          />
          <span className="text-xs text-surface-200/60">
            {chainId === 31337
              ? "Hardhat"
              : chainId === 11155111
              ? "Sepolia"
              : `Chain ${chainId}`}
          </span>
        </div>

        {/* Role badge */}
        {role !== "NONE" && (
          <span
            className={`badge ${
              role === "ADMIN"
                ? "badge-admin"
                : role === "HOSPITAL"
                ? "badge-hospital"
                : role === "DOCTOR"
                ? "badge-doctor"
                : "badge-patient"
            }`}
          >
            {role}
          </span>
        )}

        {/* Account dropdown */}
        <button
          onClick={disconnectWallet}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400" />
          <span className="text-sm font-mono text-surface-200/80">
            {shortAddress}
          </span>
          <svg
            className="w-4 h-4 text-surface-200/40 group-hover:text-red-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Not connected — show connect button
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={
          large
            ? "btn-primary text-lg px-10 py-4 animate-pulse-glow"
            : "btn-primary"
        }
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM18 8H6v2h12V8z" />
            </svg>
            Connect MetaMask
          </span>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-400/80 mt-2 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
