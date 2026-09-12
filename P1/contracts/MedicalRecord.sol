// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./RoleManager.sol";
import "./AuditLogger.sol";

/**
 * @title MedicalRecord
 * @author Healthcare DApp Team
 * @notice Manages encrypted medical record references and patient-controlled access.
 * @dev This contract stores ONLY IPFS CIDs (pointers to encrypted files), never
 *      actual medical data. The encryption/decryption happens client-side using
 *      AES-256-GCM, ensuring that even if IPFS data is publicly accessible,
 *      it remains unreadable without the patient's encryption key.
 *
 *      Access Control Flow:
 *        1. Patient uploads encrypted file to IPFS → gets CID
 *        2. Patient calls uploadRecord(CID) → stored on-chain
 *        3. Patient calls grantAccess(doctorAddr) → doctor can now fetch CIDs
 *        4. Doctor calls getRecords(patientAddr) → retrieves CIDs
 *        5. Doctor fetches encrypted file from IPFS → decrypts client-side
 */
contract MedicalRecord {

    // ─── Structs ───────────────────────────────────────────────────────

    /// @notice Represents a single medical record entry.
    struct Record {
        string ipfsHash;      // IPFS CID of the encrypted file
        string fileName;      // Original file name (for UI display)
        address owner;        // Patient who uploaded this record
        uint256 timestamp;    // Block timestamp when uploaded
        bool isActive;        // Soft-delete flag
    }

    // ─── State Variables ───────────────────────────────────────────────

    /// @notice Reference to RoleManager for permission checks.
    RoleManager public roleManager;

    /// @notice Reference to AuditLogger for event emission.
    AuditLogger public auditLogger;

    /// @notice Patient address → array of their medical records.
    mapping(address => Record[]) private patientRecords;

    /// @notice Patient address → Doctor address → has access?
    mapping(address => mapping(address => bool)) public hasAccess;

    /// @notice Patient address → list of doctors who have been granted access.
    mapping(address => address[]) private accessList;

    /// @notice Total number of records uploaded across all patients.
    uint256 public totalRecords;

    /// @notice Total number of access grants issued.
    uint256 public totalAccessGrants;

    // ─── Events ────────────────────────────────────────────────────────

    event RecordUploaded(address indexed patient, string ipfsHash, string fileName, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed doctor, uint256 timestamp);
    event AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp);
    event RecordAccessed(address indexed patient, address indexed accessor, uint256 timestamp);

    // ─── Errors ────────────────────────────────────────────────────────

    error NotPatient(address caller);
    error NotDoctor(address caller);
    error NotAuthorized(address caller, address patient);
    error AccessAlreadyGranted(address patient, address doctor);
    error AccessNotGranted(address patient, address doctor);
    error EmptyIPFSHash();
    error EmptyFileName();

    // ─── Modifiers ─────────────────────────────────────────────────────

    modifier onlyPatient() {
        if (!roleManager.hasRole(roleManager.PATIENT_ROLE(), msg.sender))
            revert NotPatient(msg.sender);
        _;
    }

    modifier onlyDoctor() {
        if (!roleManager.hasRole(roleManager.DOCTOR_ROLE(), msg.sender))
            revert NotDoctor(msg.sender);
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────

    /**
     * @param _roleManager  Address of the deployed RoleManager contract.
     * @param _auditLogger  Address of the deployed AuditLogger contract.
     */
    constructor(address _roleManager, address _auditLogger) {
        roleManager = RoleManager(_roleManager);
        auditLogger = AuditLogger(_auditLogger);
    }

    // ─── Record Management ─────────────────────────────────────────────

    /**
     * @notice Upload a new medical record (IPFS CID) to the patient's history.
     * @param _ipfsHash The IPFS CID of the encrypted file.
     * @param _fileName Original file name for display purposes.
     * @dev Only registered patients can upload. The file must already be
     *      encrypted and uploaded to IPFS before calling this function.
     */
    function uploadRecord(
        string calldata _ipfsHash,
        string calldata _fileName
    ) external onlyPatient {
        if (bytes(_ipfsHash).length == 0) revert EmptyIPFSHash();
        if (bytes(_fileName).length == 0) revert EmptyFileName();

        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            owner: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        patientRecords[msg.sender].push(newRecord);
        totalRecords++;

        // Log to audit trail
        auditLogger.logRecordUpload(msg.sender, _ipfsHash, _fileName);
        emit RecordUploaded(msg.sender, _ipfsHash, _fileName, block.timestamp);
    }

    // ─── Access Control ────────────────────────────────────────────────

    /**
     * @notice Grant a doctor access to the patient's medical records.
     * @param _doctor Address of the doctor to grant access to.
     * @dev Only patients can grant access. The doctor must be registered.
     */
    function grantAccess(address _doctor) external onlyPatient {
        if (!roleManager.hasRole(roleManager.DOCTOR_ROLE(), _doctor))
            revert NotDoctor(_doctor);
        if (hasAccess[msg.sender][_doctor])
            revert AccessAlreadyGranted(msg.sender, _doctor);

        hasAccess[msg.sender][_doctor] = true;
        accessList[msg.sender].push(_doctor);
        totalAccessGrants++;

        // Log to audit trail
        auditLogger.logAccessGrant(msg.sender, _doctor);
        emit AccessGranted(msg.sender, _doctor, block.timestamp);
    }

    /**
     * @notice Revoke a doctor's access to the patient's medical records.
     * @param _doctor Address of the doctor to revoke access from.
     */
    function revokeAccess(address _doctor) external onlyPatient {
        if (!hasAccess[msg.sender][_doctor])
            revert AccessNotGranted(msg.sender, _doctor);

        hasAccess[msg.sender][_doctor] = false;

        // Remove from access list
        address[] storage list = accessList[msg.sender];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _doctor) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        // Log to audit trail
        auditLogger.logAccessRevoke(msg.sender, _doctor);
        emit AccessRevoked(msg.sender, _doctor, block.timestamp);
    }

    // ─── Record Access ─────────────────────────────────────────────────

    /**
     * @notice Get all medical records for a patient.
     * @param _patient Address of the patient.
     * @return Array of Record structs.
     * @dev Caller must be the patient themselves or a doctor with access.
     */
    function getRecords(address _patient) external returns (Record[] memory) {
        if (msg.sender != _patient && !hasAccess[_patient][msg.sender])
            revert NotAuthorized(msg.sender, _patient);

        // Log access if it's not the patient themselves
        if (msg.sender != _patient) {
            auditLogger.logRecordAccess(_patient, msg.sender, "ALL_RECORDS");
            emit RecordAccessed(_patient, msg.sender, block.timestamp);
        }

        return patientRecords[_patient];
    }

    /**
     * @notice Get the number of records a patient has.
     * @param _patient Address of the patient.
     */
    function getRecordCount(address _patient) external view returns (uint256) {
        if (msg.sender != _patient && !hasAccess[_patient][msg.sender])
            revert NotAuthorized(msg.sender, _patient);
        return patientRecords[_patient].length;
    }

    // ─── Access List Queries ───────────────────────────────────────────

    /**
     * @notice Get all doctors who have access to a patient's records.
     * @param _patient Address of the patient.
     * @return Array of doctor addresses with access.
     */
    function getAccessList(address _patient) external view returns (address[] memory) {
        // Only the patient can see their full access list
        require(msg.sender == _patient, "Only patient can view access list");
        return accessList[_patient];
    }

    /**
     * @notice Check if a specific doctor has access to a patient's records.
     * @param _patient Address of the patient.
     * @param _doctor  Address of the doctor.
     */
    function checkAccess(
        address _patient,
        address _doctor
    ) external view returns (bool) {
        return hasAccess[_patient][_doctor];
    }

    /**
     * @notice Get all patients who have granted access to a specific doctor.
     * @param _doctor Address of the doctor.
     * @return patients Array of patient addresses.
     * @dev This iterates over all patients in the RoleManager — acceptable for
     *      testnet but would need indexing (e.g., The Graph) for production.
     */
    function getPatientsForDoctor(address _doctor) external view returns (address[] memory) {
        require(
            roleManager.hasRole(roleManager.DOCTOR_ROLE(), _doctor),
            "Not a doctor"
        );

        // Get all patients from RoleManager
        address[] memory allPatients = roleManager.getRoleMembers(
            roleManager.PATIENT_ROLE()
        );

        // Count how many have granted access to this doctor
        uint256 count = 0;
        for (uint256 i = 0; i < allPatients.length; i++) {
            if (hasAccess[allPatients[i]][_doctor]) {
                count++;
            }
        }

        // Build the result array
        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allPatients.length; i++) {
            if (hasAccess[allPatients[i]][_doctor]) {
                result[idx] = allPatients[i];
                idx++;
            }
        }

        return result;
    }
}
