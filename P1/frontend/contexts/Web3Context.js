"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESSES,
  ROLE_MANAGER_ABI,
  MEDICAL_RECORD_ABI,
  AUDIT_LOGGER_ABI,
} from "../lib/contracts";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [role, setRole] = useState("NONE");
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Contract instances
  const [roleManager, setRoleManager] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [auditLogger, setAuditLogger] = useState(null);

  // Initialize contracts with a signer
  const initContracts = useCallback(async (signerInstance) => {
    try {
      const rm = new ethers.Contract(
        CONTRACT_ADDRESSES.roleManager,
        ROLE_MANAGER_ABI,
        signerInstance
      );
      const mr = new ethers.Contract(
        CONTRACT_ADDRESSES.medicalRecord,
        MEDICAL_RECORD_ABI,
        signerInstance
      );
      const al = new ethers.Contract(
        CONTRACT_ADDRESSES.auditLogger,
        AUDIT_LOGGER_ABI,
        signerInstance
      );

      setRoleManager(rm);
      setMedicalRecord(mr);
      setAuditLogger(al);

      return rm;
    } catch (err) {
      console.error("Failed to initialize contracts:", err);
      setError("Failed to connect to smart contracts. Is the local node running?");
      return null;
    }
  }, []);

  // Fetch the user's role from the RoleManager contract
  const fetchRole = useCallback(async (address, rm) => {
    try {
      if (rm) {
        const userRole = await rm.getRole(address);
        setRole(userRole);
        return userRole;
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
      setRole("NONE");
      return "NONE";
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. Please install it to use this DApp.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Force network switch to Hardhat Local
      const hardhatChainId = '0x7a69'; // 31337 in hex
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hardhatChainId }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hardhatChainId,
                  chainName: 'Hardhat Local',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add network:", addError);
          }
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      // Initialize contracts and fetch role
      const rm = await initContracts(userSigner);
      if (rm) {
        await fetchRole(accounts[0], rm);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the MetaMask connection.");
      } else {
        setError(`Connection failed: ${err.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [initContracts, fetchRole]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setRole("NONE");
    setChainId(null);
    setRoleManager(null);
    setMedicalRecord(null);
    setAuditLogger(null);
    setError(null);
  }, []);

  // Listen for MetaMask events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        // Re-initialize connection to update signer and contracts with new account
        connectWallet();
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(Number(newChainId));
      // Reload to reset all contract states
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet, fetchRole, roleManager]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    // State
    account,
    provider,
    signer,
    role,
    chainId,
    isConnecting,
    error,

    // Contracts
    roleManager,
    medicalRecord,
    auditLogger,

    // Actions
    connectWallet,
    disconnectWallet,
    fetchRole: () => fetchRole(account, roleManager),

    // Helpers
    isConnected: !!account,
    isAdmin: role === "ADMIN",
    isHospital: role === "HOSPITAL",
    isDoctor: role === "DOCTOR",
    isPatient: role === "PATIENT",
    isRegistered: role !== "NONE",
    shortAddress: account
      ? `${account.slice(0, 6)}...${account.slice(-4)}`
      : "",
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
