// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateManager
 * @notice A blockchain-based academic certificate verification system.
 * @dev Manages university registration, student registration, certificate issuance,
 *      verification, and revocation with role-based access control.
 */
contract CertificateManager {
    // ============================================================
    //                         STATE
    // ============================================================

    address public admin;

    struct University {
        string name;
        string country;
        address walletAddress;
        bool isRegistered;
        bool isActive;
        uint256 registeredAt;
    }

    struct Student {
        string name;
        string email;
        string studentId;
        address universityAddress;
        bool isRegistered;
        uint256 registeredAt;
    }

    struct Certificate {
        string certificateId;
        string studentId;
        string courseName;
        string grade;
        string ipfsHash;
        bytes32 certHash;
        address issuedBy;
        uint256 issuedAt;
        bool isValid;
        bool isRevoked;
    }

    /// @dev University wallet address => University details
    mapping(address => University) public universities;

    /// @dev Student ID (string) => Student details
    mapping(string => Student) public students;

    /// @dev Certificate ID (string) => Certificate details
    mapping(string => Certificate) public certificates;

    /// @dev Track all registered university addresses
    address[] public universityAddresses;

    /// @dev Track all student IDs
    string[] public studentIds;

    /// @dev Track all certificate IDs
    string[] public certificateIds;

    // ============================================================
    //                         EVENTS
    // ============================================================

    event UniversityRegistered(
        address indexed walletAddress,
        string name,
        string country,
        uint256 timestamp
    );

    event UniversityDeactivated(
        address indexed walletAddress,
        uint256 timestamp
    );

    event StudentRegistered(
        string studentId,
        string name,
        address indexed universityAddress,
        uint256 timestamp
    );

    event CertificateIssued(
        string certificateId,
        string studentId,
        string courseName,
        address indexed issuedBy,
        bytes32 certHash,
        uint256 timestamp
    );

    event CertificateRevoked(
        string certificateId,
        address indexed revokedBy,
        uint256 timestamp
    );

    // ============================================================
    //                       MODIFIERS
    // ============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredUniversity() {
        require(
            universities[msg.sender].isRegistered &&
                universities[msg.sender].isActive,
            "Only active registered university can perform this action"
        );
        _;
    }

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor() {
        admin = msg.sender;
    }

    // ============================================================
    //                  UNIVERSITY MANAGEMENT
    // ============================================================

    /**
     * @notice Register a new university (admin only).
     * @param _walletAddress The Ethereum address of the university.
     * @param _name The name of the university.
     * @param _country The country of the university.
     */
    function registerUniversity(
        address _walletAddress,
        string memory _name,
        string memory _country
    ) external onlyAdmin {
        bool isNew = !universities[_walletAddress].isRegistered;
        require(_walletAddress != address(0), "Invalid wallet address");
        require(bytes(_name).length > 0, "University name cannot be empty");
        require(bytes(_country).length > 0, "Country cannot be empty");

        universities[_walletAddress] = University({
            name: _name,
            country: _country,
            walletAddress: _walletAddress,
            isRegistered: true,
            isActive: true,
            registeredAt: block.timestamp
        });

        if (isNew) {
            universityAddresses.push(_walletAddress);
        }

        emit UniversityRegistered(
            _walletAddress,
            _name,
            _country,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a university (admin only).
     * @param _walletAddress The address of the university to deactivate.
     */
    function deactivateUniversity(
        address _walletAddress
    ) external onlyAdmin {
        require(
            universities[_walletAddress].isRegistered,
            "University not registered"
        );
        require(
            universities[_walletAddress].isActive,
            "University already inactive"
        );

        universities[_walletAddress].isActive = false;

        emit UniversityDeactivated(_walletAddress, block.timestamp);
    }

    // ============================================================
    //                   STUDENT MANAGEMENT
    // ============================================================

    /**
     * @notice Register a new student (university only).
     * @param _studentId Unique student identifier.
     * @param _name Student full name.
     * @param _email Student email address.
     */
    function registerStudent(
        string memory _studentId,
        string memory _name,
        string memory _email
    ) external onlyRegisteredUniversity {
        bool isNew = !students[_studentId].isRegistered;
        require(bytes(_studentId).length > 0, "Student ID cannot be empty");
        require(bytes(_name).length > 0, "Student name cannot be empty");

        students[_studentId] = Student({
            name: _name,
            email: _email,
            studentId: _studentId,
            universityAddress: msg.sender,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        if (isNew) {
            studentIds.push(_studentId);
        }

        emit StudentRegistered(
            _studentId,
            _name,
            msg.sender,
            block.timestamp
        );
    }

    // ============================================================
    //                 CERTIFICATE MANAGEMENT
    // ============================================================

    /**
     * @notice Issue a new certificate (university only).
     * @param _certificateId Unique certificate identifier.
     * @param _studentId The student receiving the certificate.
     * @param _courseName Name of the course / degree.
     * @param _grade Grade or classification.
     * @param _ipfsHash IPFS hash of the certificate document.
     */
    function issueCertificate(
        string memory _certificateId,
        string memory _studentId,
        string memory _courseName,
        string memory _grade,
        string memory _ipfsHash
    ) external onlyRegisteredUniversity {
        require(
            students[_studentId].isRegistered,
            "Student not registered"
        );
        require(
            students[_studentId].universityAddress == msg.sender,
            "Student not registered under your university"
        );
        require(bytes(_courseName).length > 0, "Course name cannot be empty");

        // Generate certificate hash from the data for tamper detection
        bytes32 certHash = keccak256(
            abi.encodePacked(
                _certificateId,
                _studentId,
                _courseName,
                _grade,
                _ipfsHash,
                msg.sender,
                block.timestamp
            )
        );

        bool isNew = bytes(certificates[_certificateId].certificateId).length == 0;

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            studentId: _studentId,
            courseName: _courseName,
            grade: _grade,
            ipfsHash: _ipfsHash,
            certHash: certHash,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            isValid: true,
            isRevoked: false
        });

        if (isNew) {
            certificateIds.push(_certificateId);
        }

        emit CertificateIssued(
            _certificateId,
            _studentId,
            _courseName,
            msg.sender,
            certHash,
            block.timestamp
        );
    }

    /**
     * @notice Revoke a certificate (admin or issuing university).
     * @param _certificateId The certificate to revoke.
     */
    function revokeCertificate(
        string memory _certificateId
    ) external {
        Certificate storage cert = certificates[_certificateId];
        require(cert.isValid, "Certificate is not valid or does not exist");
        require(!cert.isRevoked, "Certificate already revoked");
        require(
            msg.sender == admin || msg.sender == cert.issuedBy,
            "Only admin or issuing university can revoke"
        );

        cert.isValid = false;
        cert.isRevoked = true;

        emit CertificateRevoked(_certificateId, msg.sender, block.timestamp);
    }

    // ============================================================
    //                    VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Verify a certificate by its ID.
     * @param _certificateId The certificate ID to verify.
     * @return isValid Whether the certificate is currently valid.
     * @return studentId The student ID on the certificate.
     * @return courseName The course name.
     * @return grade The grade received.
     * @return issuedBy Address of the issuing university.
     * @return issuedAt Timestamp of issuance.
     * @return certHash The certificate hash for tamper detection.
     */
    function verifyCertificate(
        string memory _certificateId
    )
        external
        view
        returns (
            bool isValid,
            string memory studentId,
            string memory courseName,
            string memory grade,
            address issuedBy,
            uint256 issuedAt,
            bytes32 certHash
        )
    {
        Certificate memory cert = certificates[_certificateId];
        require(
            bytes(cert.certificateId).length > 0,
            "Certificate does not exist"
        );

        return (
            cert.isValid,
            cert.studentId,
            cert.courseName,
            cert.grade,
            cert.issuedBy,
            cert.issuedAt,
            cert.certHash
        );
    }

    /**
     * @notice Get full certificate details.
     */
    function getCertificateDetails(
        string memory _certificateId
    ) external view returns (Certificate memory) {
        require(
            bytes(certificates[_certificateId].certificateId).length > 0,
            "Certificate does not exist"
        );
        return certificates[_certificateId];
    }

    /**
     * @notice Get university details.
     */
    function getUniversityDetails(
        address _walletAddress
    ) external view returns (University memory) {
        require(
            universities[_walletAddress].isRegistered,
            "University not registered"
        );
        return universities[_walletAddress];
    }

    /**
     * @notice Get student details.
     */
    function getStudentDetails(
        string memory _studentId
    ) external view returns (Student memory) {
        require(students[_studentId].isRegistered, "Student not registered");
        return students[_studentId];
    }

    // ============================================================
    //                    STATISTICS
    // ============================================================

    function getTotalUniversities() external view returns (uint256) {
        return universityAddresses.length;
    }

    function getTotalStudents() external view returns (uint256) {
        return studentIds.length;
    }

    function getTotalCertificates() external view returns (uint256) {
        return certificateIds.length;
    }

    function getAllUniversityAddresses()
        external
        view
        returns (address[] memory)
    {
        return universityAddresses;
    }

    function getAllStudentIds() external view returns (string[] memory) {
        return studentIds;
    }

    function getAllCertificateIds() external view returns (string[] memory) {
        return certificateIds;
    }
}
