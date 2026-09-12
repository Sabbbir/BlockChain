/**
 * Smart Contract ABIs and Addresses
 *
 * ABIs are extracted from Hardhat compilation artifacts.
 * Addresses are set after deployment (via .env or hardcoded for local dev).
 */

// ─── Contract Addresses ─────────────────────────────────────────────
// For local Hardhat: these will be set dynamically after deployment
// For Sepolia: set via NEXT_PUBLIC_ env vars

export const CONTRACT_ADDRESSES = {
  auditLogger:
    process.env.NEXT_PUBLIC_AUDIT_LOGGER_ADDRESS ||
    "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  roleManager:
    process.env.NEXT_PUBLIC_ROLE_MANAGER_ADDRESS ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  medicalRecord:
    process.env.NEXT_PUBLIC_MEDICAL_RECORD_ADDRESS ||
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

// ─── AuditLogger ABI ────────────────────────────────────────────────

export const AUDIT_LOGGER_ABI = [
  "event RecordUploaded(address indexed patient, string ipfsHash, string fileName, uint256 timestamp)",
  "event AccessGranted(address indexed patient, address indexed doctor, uint256 timestamp)",
  "event AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp)",
  "event RecordAccessed(address indexed patient, address indexed accessor, string ipfsHash, uint256 timestamp)",
  "event UserRegistered(address indexed user, string role, uint256 timestamp)",
  "event HospitalApproved(address indexed hospital, address indexed approvedBy, uint256 timestamp)",
  "function logRecordUpload(address _patient, string _ipfsHash, string _fileName)",
  "function logAccessGrant(address _patient, address _doctor)",
  "function logAccessRevoke(address _patient, address _doctor)",
  "function logRecordAccess(address _patient, address _accessor, string _ipfsHash)",
  "function logUserRegistration(address _user, string _role)",
  "function logHospitalApproval(address _hospital, address _approvedBy)",
];

// ─── RoleManager ABI ────────────────────────────────────────────────

export const ROLE_MANAGER_ABI = [
  "event PatientRegistered(address indexed patient)",
  "event HospitalRegistrationRequested(address indexed hospital)",
  "event HospitalApproved(address indexed hospital, address indexed admin)",
  "event DoctorRegistered(address indexed doctor, address indexed hospital)",

  "function HOSPITAL_ROLE() view returns (bytes32)",
  "function DOCTOR_ROLE() view returns (bytes32)",
  "function PATIENT_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",

  "function registerPatient()",
  "function requestHospitalRegistration()",
  "function approveHospital(address _hospital)",
  "function registerDoctor(address _doctor)",

  "function getRole(address _account) view returns (string)",
  "function isRegistered(address _account) view returns (bool)",
  "function getRoleMembers(bytes32 _role) view returns (address[])",
  "function getSystemStats() view returns (uint256 admins, uint256 hospitals, uint256 doctors, uint256 patients)",
  "function pendingHospitals(address) view returns (bool)",
  "function doctorToHospital(address) view returns (address)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

// ─── MedicalRecord ABI ──────────────────────────────────────────────

export const MEDICAL_RECORD_ABI = [
  "event RecordUploaded(address indexed patient, string ipfsHash, string fileName, uint256 timestamp)",
  "event AccessGranted(address indexed patient, address indexed doctor, uint256 timestamp)",
  "event AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp)",
  "event RecordAccessed(address indexed patient, address indexed accessor, uint256 timestamp)",

  "function uploadRecord(string _ipfsHash, string _fileName)",
  "function grantAccess(address _doctor)",
  "function revokeAccess(address _doctor)",
  "function getRecords(address _patient) returns (tuple(string ipfsHash, string fileName, address owner, uint256 timestamp, bool isActive)[])",
  "function getRecordCount(address _patient) view returns (uint256)",
  "function getAccessList(address _patient) view returns (address[])",
  "function checkAccess(address _patient, address _doctor) view returns (bool)",
  "function getPatientsForDoctor(address _doctor) view returns (address[])",
  "function hasAccess(address, address) view returns (bool)",
  "function totalRecords() view returns (uint256)",
  "function totalAccessGrants() view returns (uint256)",
];

// ─── Network Configuration ──────────────────────────────────────────

export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "",
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ""}`,
    blockExplorer: "https://sepolia.etherscan.io",
  },
};
