"use client";

import { useWeb3 } from "../../contexts/Web3Context";
import WalletConnect from "../WalletConnect";

/**
 * Shared dashboard layout for all roles.
 * Provides navigation, header, and consistent styling.
 */
export default function DashboardLayout({ title, icon, children, tabs, activeTab, onTabChange }) {
  const { shortAddress, role } = useWeb3();

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">
            M
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">MedChain</span>
        </div>

        <WalletConnect />
      </nav>

      {/* Dashboard Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/10 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-sm text-surface-200/40">
                Logged in as {shortAddress}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          {tabs && tabs.length > 0 && (
            <div className="flex gap-1 p-1 bg-surface-900/50 rounded-xl border border-white/5 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                      : "text-surface-200/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
