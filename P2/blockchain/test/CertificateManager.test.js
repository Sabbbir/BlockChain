const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateManager", function () {
  let contract;
  let admin, university1, university2, employer, other;

  beforeEach(async function () {
    [admin, university1, university2, employer, other] =
      await ethers.getSigners();

    const CertificateManager = await ethers.getContractFactory(
      "CertificateManager"
    );
    contract = await CertificateManager.deploy();
    await contract.waitForDeployment();
  });

  // ──────────────────────────────────────
  //  DEPLOYMENT
  // ──────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("Should start with zero universities, students and certificates", async function () {
      expect(await contract.getTotalUniversities()).to.equal(0);
      expect(await contract.getTotalStudents()).to.equal(0);
      expect(await contract.getTotalCertificates()).to.equal(0);
    });
  });

  // ──────────────────────────────────────
  //  UNIVERSITY REGISTRATION
  // ──────────────────────────────────────
  describe("University Registration", function () {
    it("Should allow admin to register a university", async function () {
      await expect(
        contract.registerUniversity(
          university1.address,
          "Dhaka University",
          "Bangladesh"
        )
      )
        .to.emit(contract, "UniversityRegistered")
        .withArgs(
          university1.address,
          "Dhaka University",
          "Bangladesh",
          (v) => v > 0
        );

      const uni = await contract.getUniversityDetails(university1.address);
      expect(uni.name).to.equal("Dhaka University");
      expect(uni.country).to.equal("Bangladesh");
      expect(uni.isRegistered).to.be.true;
      expect(uni.isActive).to.be.true;
      expect(await contract.getTotalUniversities()).to.equal(1);
    });

    it("Should reject duplicate university registration", async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await expect(
        contract.registerUniversity(
          university1.address,
          "Dhaka University",
          "Bangladesh"
        )
      ).to.be.revertedWith("University already registered");
    });

    it("Should reject registration from non-admin", async function () {
      await expect(
        contract
          .connect(other)
          .registerUniversity(
            university1.address,
            "Dhaka University",
            "Bangladesh"
          )
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject empty university name", async function () {
      await expect(
        contract.registerUniversity(university1.address, "", "Bangladesh")
      ).to.be.revertedWith("University name cannot be empty");
    });

    it("Should reject zero address", async function () {
      await expect(
        contract.registerUniversity(
          ethers.ZeroAddress,
          "Dhaka University",
          "Bangladesh"
        )
      ).to.be.revertedWith("Invalid wallet address");
    });
  });

  // ──────────────────────────────────────
  //  UNIVERSITY DEACTIVATION
  // ──────────────────────────────────────
  describe("University Deactivation", function () {
    beforeEach(async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
    });

    it("Should allow admin to deactivate a university", async function () {
      await expect(contract.deactivateUniversity(university1.address))
        .to.emit(contract, "UniversityDeactivated")
        .withArgs(university1.address, (v) => v > 0);

      const uni = await contract.getUniversityDetails(university1.address);
      expect(uni.isActive).to.be.false;
    });

    it("Should reject deactivation from non-admin", async function () {
      await expect(
        contract.connect(other).deactivateUniversity(university1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should reject deactivating unregistered university", async function () {
      await expect(
        contract.deactivateUniversity(other.address)
      ).to.be.revertedWith("University not registered");
    });

    it("Should reject deactivating already inactive university", async function () {
      await contract.deactivateUniversity(university1.address);
      await expect(
        contract.deactivateUniversity(university1.address)
      ).to.be.revertedWith("University already inactive");
    });
  });

  // ──────────────────────────────────────
  //  STUDENT REGISTRATION
  // ──────────────────────────────────────
  describe("Student Registration", function () {
    beforeEach(async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
    });

    it("Should allow university to register a student", async function () {
      await expect(
        contract
          .connect(university1)
          .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu")
      )
        .to.emit(contract, "StudentRegistered")
        .withArgs("STU-001", "Sabbir Ahmed", university1.address, (v) => v > 0);

      const student = await contract.getStudentDetails("STU-001");
      expect(student.name).to.equal("Sabbir Ahmed");
      expect(student.email).to.equal("sabbir@du.edu");
      expect(student.universityAddress).to.equal(university1.address);
      expect(await contract.getTotalStudents()).to.equal(1);
    });

    it("Should reject student registration from non-university", async function () {
      await expect(
        contract
          .connect(other)
          .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu")
      ).to.be.revertedWith(
        "Only active registered university can perform this action"
      );
    });

    it("Should reject duplicate student ID", async function () {
      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
      await expect(
        contract
          .connect(university1)
          .registerStudent("STU-001", "Another Student", "another@du.edu")
      ).to.be.revertedWith("Student already registered");
    });

    it("Should reject empty student ID", async function () {
      await expect(
        contract
          .connect(university1)
          .registerStudent("", "Sabbir Ahmed", "sabbir@du.edu")
      ).to.be.revertedWith("Student ID cannot be empty");
    });

    it("Should reject student registration from deactivated university", async function () {
      await contract.deactivateUniversity(university1.address);
      await expect(
        contract
          .connect(university1)
          .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu")
      ).to.be.revertedWith(
        "Only active registered university can perform this action"
      );
    });
  });

  // ──────────────────────────────────────
  //  CERTIFICATE ISSUANCE
  // ──────────────────────────────────────
  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
    });

    it("Should allow university to issue a certificate", async function () {
      await expect(
        contract
          .connect(university1)
          .issueCertificate(
            "CERT-2026-001",
            "STU-001",
            "Computer Science",
            "A+",
            "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
          )
      )
        .to.emit(contract, "CertificateIssued")
        .withArgs(
          "CERT-2026-001",
          "STU-001",
          "Computer Science",
          university1.address,
          (v) => v !== ethers.ZeroHash,
          (v) => v > 0
        );

      const cert = await contract.getCertificateDetails("CERT-2026-001");
      expect(cert.studentId).to.equal("STU-001");
      expect(cert.courseName).to.equal("Computer Science");
      expect(cert.grade).to.equal("A+");
      expect(cert.isValid).to.be.true;
      expect(cert.isRevoked).to.be.false;
      expect(cert.issuedBy).to.equal(university1.address);
      expect(await contract.getTotalCertificates()).to.equal(1);
    });

    it("Should reject duplicate certificate ID", async function () {
      await contract
        .connect(university1)
        .issueCertificate(
          "CERT-2026-001",
          "STU-001",
          "Computer Science",
          "A+",
          "QmHash1"
        );
      await expect(
        contract
          .connect(university1)
          .issueCertificate(
            "CERT-2026-001",
            "STU-001",
            "Math",
            "B+",
            "QmHash2"
          )
      ).to.be.revertedWith("Certificate ID already exists");
    });

    it("Should reject issuance for unregistered student", async function () {
      await expect(
        contract
          .connect(university1)
          .issueCertificate(
            "CERT-2026-002",
            "STU-999",
            "Computer Science",
            "A+",
            "QmHash"
          )
      ).to.be.revertedWith("Student not registered");
    });

    it("Should reject issuance by wrong university", async function () {
      await contract.registerUniversity(
        university2.address,
        "BUET",
        "Bangladesh"
      );
      await expect(
        contract
          .connect(university2)
          .issueCertificate(
            "CERT-2026-002",
            "STU-001",
            "Computer Science",
            "A+",
            "QmHash"
          )
      ).to.be.revertedWith("Student not registered under your university");
    });

    it("Should reject issuance from non-university", async function () {
      await expect(
        contract
          .connect(other)
          .issueCertificate(
            "CERT-2026-002",
            "STU-001",
            "Computer Science",
            "A+",
            "QmHash"
          )
      ).to.be.revertedWith(
        "Only active registered university can perform this action"
      );
    });
  });

  // ──────────────────────────────────────
  //  CERTIFICATE VERIFICATION
  // ──────────────────────────────────────
  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
      await contract
        .connect(university1)
        .issueCertificate(
          "CERT-2026-001",
          "STU-001",
          "Computer Science",
          "A+",
          "QmHash"
        );
    });

    it("Should allow anyone to verify a certificate", async function () {
      const result = await contract
        .connect(employer)
        .verifyCertificate("CERT-2026-001");
      expect(result.isValid).to.be.true;
      expect(result.studentId).to.equal("STU-001");
      expect(result.courseName).to.equal("Computer Science");
      expect(result.grade).to.equal("A+");
      expect(result.issuedBy).to.equal(university1.address);
    });

    it("Should return invalid for non-existent certificate", async function () {
      await expect(
        contract.verifyCertificate("CERT-INVALID")
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should detect revoked certificates", async function () {
      await contract
        .connect(university1)
        .revokeCertificate("CERT-2026-001");
      const result = await contract.verifyCertificate("CERT-2026-001");
      expect(result.isValid).to.be.false;
    });
  });

  // ──────────────────────────────────────
  //  CERTIFICATE REVOCATION
  // ──────────────────────────────────────
  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
      await contract
        .connect(university1)
        .issueCertificate(
          "CERT-2026-001",
          "STU-001",
          "Computer Science",
          "A+",
          "QmHash"
        );
    });

    it("Should allow issuing university to revoke", async function () {
      await expect(
        contract.connect(university1).revokeCertificate("CERT-2026-001")
      )
        .to.emit(contract, "CertificateRevoked")
        .withArgs("CERT-2026-001", university1.address, (v) => v > 0);

      const cert = await contract.getCertificateDetails("CERT-2026-001");
      expect(cert.isValid).to.be.false;
      expect(cert.isRevoked).to.be.true;
    });

    it("Should allow admin to revoke any certificate", async function () {
      await expect(contract.revokeCertificate("CERT-2026-001"))
        .to.emit(contract, "CertificateRevoked")
        .withArgs("CERT-2026-001", admin.address, (v) => v > 0);
    });

    it("Should reject revocation from unauthorized user", async function () {
      await expect(
        contract.connect(other).revokeCertificate("CERT-2026-001")
      ).to.be.revertedWith(
        "Only admin or issuing university can revoke"
      );
    });

    it("Should reject revoking already revoked certificate", async function () {
      await contract.connect(university1).revokeCertificate("CERT-2026-001");
      await expect(
        contract.connect(university1).revokeCertificate("CERT-2026-001")
      ).to.be.revertedWith("Certificate is not valid or does not exist");
    });
  });

  // ──────────────────────────────────────
  //  STATISTICS
  // ──────────────────────────────────────
  describe("Statistics", function () {
    it("Should track counts correctly", async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await contract.registerUniversity(
        university2.address,
        "BUET",
        "Bangladesh"
      );
      expect(await contract.getTotalUniversities()).to.equal(2);

      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
      await contract
        .connect(university1)
        .registerStudent("STU-002", "Rahim Khan", "rahim@du.edu");
      expect(await contract.getTotalStudents()).to.equal(2);

      await contract
        .connect(university1)
        .issueCertificate("CERT-001", "STU-001", "CS", "A", "QmHash1");
      await contract
        .connect(university1)
        .issueCertificate("CERT-002", "STU-002", "Math", "B+", "QmHash2");
      expect(await contract.getTotalCertificates()).to.equal(2);
    });

    it("Should return all IDs and addresses", async function () {
      await contract.registerUniversity(
        university1.address,
        "Dhaka University",
        "Bangladesh"
      );
      await contract
        .connect(university1)
        .registerStudent("STU-001", "Sabbir Ahmed", "sabbir@du.edu");
      await contract
        .connect(university1)
        .issueCertificate("CERT-001", "STU-001", "CS", "A", "QmHash");

      const uniAddrs = await contract.getAllUniversityAddresses();
      expect(uniAddrs).to.include(university1.address);

      const stuIds = await contract.getAllStudentIds();
      expect(stuIds).to.include("STU-001");

      const certIds = await contract.getAllCertificateIds();
      expect(certIds).to.include("CERT-001");
    });
  });
});
