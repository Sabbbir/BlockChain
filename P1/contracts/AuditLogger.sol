// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AuditLogger
 * @author Healthcare DApp Team
 * @notice Immutable audit trail for all healthcare data operations.
 * @dev Emits events for every critical action. Events are stored in transaction
 *      logs (not contract state), making them gas-efficient and queryable
 *      from the frontend via ethers.js filters.
 *
 *      Design Decision: We use a separate AuditLogger contract so that audit
 *      events have a single, canonical source address. This makes it trivial
 *      to index all audit events from one contract address on block explorers
 *      or subgraphs, rather than collecting events from multiple contracts.
 */
contract AuditLogger {

    // ─── Events ────────────────────────────────────────────────────────

    /// @notice Emitted when a patient uploads a new medical record.
    event RecordUploaded(
        address indexed patient,
        string ipfsHash,
        string fileName,
        uint256 timestamp
    );

    /// @notice Emitted when a patient grants a doctor access to their records.
    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    /// @notice Emitted when a patient revokes a doctor's access.
    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    /// @notice Emitted when an authorized entity accesses a patient's record.
    event RecordAccessed(
        address indexed patient,
        address indexed accessor,
        string ipfsHash,
        uint256 timestamp
    );

    /// @notice Emitted when a new user registers in the system.
    event UserRegistered(
        address indexed user,
        string role,
        uint256 timestamp
    );

    /// @notice Emitted when a hospital is approved by an admin.
    event HospitalApproved(
        address indexed hospital,
        address indexed approvedBy,
        uint256 timestamp
    );

    // ─── Logging Functions ─────────────────────────────────────────────

    /**
     * @notice Log a medical record upload event.
     * @param _patient  Address of the patient who uploaded.
     * @param _ipfsHash IPFS CID of the encrypted file.
     * @param _fileName Original file name (for display only).
     */
    function logRecordUpload(
        address _patient,
        string calldata _ipfsHash,
        string calldata _fileName
    ) external {
        emit RecordUploaded(_patient, _ipfsHash, _fileName, block.timestamp);
    }

    /**
     * @notice Log an access grant event.
     * @param _patient Address of the patient granting access.
     * @param _doctor  Address of the doctor receiving access.
     */
    function logAccessGrant(address _patient, address _doctor) external {
        emit AccessGranted(_patient, _doctor, block.timestamp);
    }

    /**
     * @notice Log an access revocation event.
     * @param _patient Address of the patient revoking access.
     * @param _doctor  Address of the doctor losing access.
     */
    function logAccessRevoke(address _patient, address _doctor) external {
        emit AccessRevoked(_patient, _doctor, block.timestamp);
    }

    /**
     * @notice Log a record access event.
     * @param _patient  Address of the patient whose record was accessed.
     * @param _accessor Address of the entity accessing the record.
     * @param _ipfsHash IPFS CID of the record that was accessed.
     */
    function logRecordAccess(
        address _patient,
        address _accessor,
        string calldata _ipfsHash
    ) external {
        emit RecordAccessed(_patient, _accessor, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Log a user registration event.
     * @param _user Address of the new user.
     * @param _role Role string (e.g., "PATIENT", "DOCTOR", "HOSPITAL", "ADMIN").
     */
    function logUserRegistration(
        address _user,
        string calldata _role
    ) external {
        emit UserRegistered(_user, _role, block.timestamp);
    }

    /**
     * @notice Log a hospital approval event.
     * @param _hospital   Address of the approved hospital.
     * @param _approvedBy Address of the admin who approved.
     */
    function logHospitalApproval(
        address _hospital,
        address _approvedBy
    ) external {
        emit HospitalApproved(_hospital, _approvedBy, block.timestamp);
    }
}
