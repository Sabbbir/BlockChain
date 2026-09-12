// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AuditLogger.sol";

/**
 * @title RoleManager
 * @author Healthcare DApp Team
 * @notice Manages Role-Based Access Control (RBAC) for the healthcare system.
 * @dev Extends OpenZeppelin's AccessControl for battle-tested role management.
 *
 *      Role Hierarchy:
 *        ADMIN (deployer) ──► approves HOSPITAL
 *        HOSPITAL          ──► registers DOCTOR
 *        PATIENT            ──► self-registers
 *
 *      Each role is a bytes32 constant derived from keccak256 for gas efficiency.
 */
contract RoleManager is AccessControl {

    // ─── Role Definitions ──────────────────────────────────────────────

    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant DOCTOR_ROLE   = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE  = keccak256("PATIENT_ROLE");

    // ─── State ─────────────────────────────────────────────────────────

    /// @notice Reference to the AuditLogger contract for event emission.
    AuditLogger public auditLogger;

    /// @notice Tracks pending (unapproved) hospital registrations.
    mapping(address => bool) public pendingHospitals;

    /// @notice Maps a doctor address to the hospital that registered them.
    mapping(address => address) public doctorToHospital;

    /// @notice Stores all registered addresses for enumeration per role.
    mapping(bytes32 => address[]) private _roleMembers;

    /// @notice Quick lookup: is this address already in _roleMembers?
    mapping(address => bool) private _isRegistered;

    // ─── Events ────────────────────────────────────────────────────────

    event HospitalRegistrationRequested(address indexed hospital);
    event HospitalApproved(address indexed hospital, address indexed admin);
    event DoctorRegistered(address indexed doctor, address indexed hospital);
    event PatientRegistered(address indexed patient);

    // ─── Errors ────────────────────────────────────────────────────────

    error AlreadyRegistered(address account);
    error NotPendingHospital(address account);
    error HospitalNotApproved(address hospital);

    // ─── Constructor ───────────────────────────────────────────────────

    /**
     * @param _auditLogger Address of the deployed AuditLogger contract.
     * @param _initialAdmin Address to grant the DEFAULT_ADMIN_ROLE.
     */
    constructor(address _auditLogger, address _initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        auditLogger = AuditLogger(_auditLogger);

        // Register deployer
        _isRegistered[_initialAdmin] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE].push(_initialAdmin);
    }

    // ─── Patient Registration (Self-Service) ───────────────────────────

    /**
     * @notice Allows any wallet to self-register as a Patient.
     * @dev No approval needed — patients register directly.
     */
    function registerPatient() external {
        // if (_isRegistered[msg.sender]) revert AlreadyRegistered(msg.sender);

        _grantRole(PATIENT_ROLE, msg.sender);
        _isRegistered[msg.sender] = true;
        _roleMembers[PATIENT_ROLE].push(msg.sender);

        auditLogger.logUserRegistration(msg.sender, "PATIENT");
        emit PatientRegistered(msg.sender);
    }

    // ─── Hospital Registration (Two-Step: Request → Approve) ───────────

    /**
     * @notice Request registration as a Hospital (requires admin approval).
     */
    function requestHospitalRegistration() external {
        // if (_isRegistered[msg.sender]) revert AlreadyRegistered(msg.sender);

        pendingHospitals[msg.sender] = true;
        emit HospitalRegistrationRequested(msg.sender);
    }

    /**
     * @notice Admin approves a pending hospital registration.
     * @param _hospital Address of the hospital to approve.
     */
    function approveHospital(address _hospital) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!pendingHospitals[_hospital]) revert NotPendingHospital(_hospital);

        pendingHospitals[_hospital] = false;
        _grantRole(HOSPITAL_ROLE, _hospital);
        _isRegistered[_hospital] = true;
        _roleMembers[HOSPITAL_ROLE].push(_hospital);

        auditLogger.logHospitalApproval(_hospital, msg.sender);
        auditLogger.logUserRegistration(_hospital, "HOSPITAL");
        emit HospitalApproved(_hospital, msg.sender);
    }

    // ─── Doctor Registration (By Approved Hospital) ────────────────────

    /**
     * @notice An approved hospital registers a doctor.
     * @param _doctor Address of the doctor to register.
     */
    function registerDoctor(address _doctor) external onlyRole(HOSPITAL_ROLE) {
        // if (_isRegistered[_doctor]) revert AlreadyRegistered(_doctor);

        _grantRole(DOCTOR_ROLE, _doctor);
        _isRegistered[_doctor] = true;
        _roleMembers[DOCTOR_ROLE].push(_doctor);
        doctorToHospital[_doctor] = msg.sender;

        auditLogger.logUserRegistration(_doctor, "DOCTOR");
        emit DoctorRegistered(_doctor, msg.sender);
    }

    // ─── View Functions ────────────────────────────────────────────────

    /**
     * @notice Get the role of an address as a human-readable string.
     * @param _account The address to query.
     * @return The role string. Returns "NONE" if unregistered.
     */
    function getRole(address _account) external view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, _account)) return "ADMIN";
        if (hasRole(HOSPITAL_ROLE, _account))      return "HOSPITAL";
        if (hasRole(DOCTOR_ROLE, _account))         return "DOCTOR";
        if (hasRole(PATIENT_ROLE, _account))        return "PATIENT";
        return "NONE";
    }

    /**
     * @notice Check if an address is registered in any role.
     * @param _account The address to check.
     */
    function isRegistered(address _account) external view returns (bool) {
        return _isRegistered[_account];
    }

    /**
     * @notice Get all addresses holding a specific role.
     * @param _role The bytes32 role identifier.
     * @return Array of addresses with that role.
     */
    function getRoleMembers(bytes32 _role) external view returns (address[] memory) {
        return _roleMembers[_role];
    }

    /**
     * @notice Get system statistics (total counts per role).
     * @return admins Number of admins.
     * @return hospitals Number of approved hospitals.
     * @return doctors Number of registered doctors.
     * @return patients Number of registered patients.
     */
    function getSystemStats() external view returns (
        uint256 admins,
        uint256 hospitals,
        uint256 doctors,
        uint256 patients
    ) {
        admins    = _roleMembers[DEFAULT_ADMIN_ROLE].length;
        hospitals = _roleMembers[HOSPITAL_ROLE].length;
        doctors   = _roleMembers[DOCTOR_ROLE].length;
        patients  = _roleMembers[PATIENT_ROLE].length;
    }
}
