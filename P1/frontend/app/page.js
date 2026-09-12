"use client";

import { useWeb3 } from "../contexts/Web3Context";
import WalletConnect from "../components/WalletConnect";
import RoleRegistration from "../components/RoleRegistration";
import DashboardRouter from "../components/DashboardRouter";

export default function Home() {
  const { isConnected, isRegistered } = useWeb3();

  // Not connected — show landing page
  if (!isConnected) {
    return <LandingPage />;
  }

  // Connected but not registered — show registration
  if (!isRegistered) {
    return <RoleRegistration />;
  }

  // Connected and registered — show dashboard
  return <DashboardRouter />;
}

function LandingPage() {
  return (
    <div className="min-h-screen animated-gradient-bg flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MedChain</span>
        </div>
        <WalletConnect />
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Glowing orb decoration */}
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-4 bg-primary-500/20 blur-3xl rounded-full" />
            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="gradient-text">Secure Healthcare</span>
            <br />
            <span className="text-white">on the Blockchain</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-200/60 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Patient-controlled medical records with AES-256 encryption,
            decentralized IPFS storage, and immutable audit trails.
            Your data, your rules.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <FeatureCard
              icon="🔐"
              title="End-to-End Encrypted"
              description="AES-256-GCM encryption in your browser. Raw data never leaves your device."
            />
            <FeatureCard
              icon="🌐"
              title="Decentralized Storage"
              description="Files stored on IPFS. No single point of failure, no central server."
            />
            <FeatureCard
              icon="📋"
              title="Immutable Audit Trail"
              description="Every access logged on-chain. Transparent, tamper-proof history."
            />
          </div>

          <WalletConnect large />

          {/* Tech badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {["Ethereum", "Solidity", "IPFS", "Next.js", "MetaMask", "AES-256"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-surface-200/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-surface-200/30 border-t border-white/5">
        Built with Ethereum, IPFS & Next.js — Blockchain-Based Healthcare DApp
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card-hover p-6 text-left">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-200/50 leading-relaxed">{description}</p>
    </div>
  );
}
