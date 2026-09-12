const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecord", function () {
  let roleManager, auditLogger, medicalRecord;
  let admin, hospital, doctor, doctor2, patient, patient2, stranger;

  beforeEach(async function () {
    [admin, hospital, doctor, doctor2, patient, patient2, stranger] =
      await ethers.getSigners();

    // Deploy AuditLogger
    const AuditLogger = await ethers.getContractFactory("AuditLogger");
    auditLogger = await AuditLogger.deploy();
    await auditLogger.waitForDeployment();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy(await auditLogger.getAddress(), admin.address);
    await roleManager.waitForDeployment();

    // Deploy MedicalRecord
    const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
    medicalRecord = await MedicalRecord.deploy(
      await roleManager.getAddress(),
      await auditLogger.getAddress()
    );
    await medicalRecord.waitForDeployment();

    // Setup roles: patient, hospital → doctor
    await roleManager.connect(patient).registerPatient();
    await roleManager.connect(patient2).registerPatient();
    await roleManager.connect(hospital).requestHospitalRegistration();
    await roleManager.connect(admin).approveHospital(hospital.address);
    await roleManager.connect(hospital).registerDoctor(doctor.address);
    await roleManager.connect(hospital).registerDoctor(doctor2.address);
  });

  // ─────────────────────────────────────────────────────────────────
  // Record Upload
  // ─────────────────────────────────────────────────────────────────

  describe("Record Upload", function () {
    it("Should allow patient to upload a record", async function () {
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const fileName = "blood_test_results.pdf";

      await expect(
        medicalRecord.connect(patient).uploadRecord(ipfsHash, fileName)
      )
        .to.emit(medicalRecord, "RecordUploaded")
        .withArgs(patient.address, ipfsHash, fileName, (v) => v > 0);
    });

    it("Should emit audit log event on upload", async function () {
      await expect(
        medicalRecord
          .connect(patient)
          .uploadRecord("QmHash123", "test.pdf")
      ).to.emit(auditLogger, "RecordUploaded");
    });

    it("Should increment total records counter", async function () {
      await medicalRecord
        .connect(patient)
        .uploadRecord("QmHash1", "file1.pdf");
      await medicalRecord
        .connect(patient)
        .uploadRecord("QmHash2", "file2.pdf");

      expect(await medicalRecord.totalRecords()).to.equal(2);
    });

    it("Should revert if non-patient tries to upload", async function () {
      await expect(
        medicalRecord.connect(doctor).uploadRecord("QmHash", "test.pdf")
      ).to.be.revertedWithCustomError(medicalRecord, "NotPatient");
    });

    it("Should revert if unregistered user tries to upload", async function () {
      await expect(
        medicalRecord.connect(stranger).uploadRecord("QmHash", "test.pdf")
      ).to.be.revertedWithCustomError(medicalRecord, "NotPatient");
    });

    it("Should revert with empty IPFS hash", async function () {
      await expect(
        medicalRecord.connect(patient).uploadRecord("", "test.pdf")
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyIPFSHash");
    });

    it("Should revert with empty file name", async function () {
      await expect(
        medicalRecord.connect(patient).uploadRecord("QmHash", "")
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyFileName");
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Access Control
  // ─────────────────────────────────────────────────────────────────

  describe("Access Control", function () {
    it("Should allow patient to grant access to doctor", async function () {
      await expect(
        medicalRecord.connect(patient).grantAccess(doctor.address)
      )
        .to.emit(medicalRecord, "AccessGranted")
        .withArgs(patient.address, doctor.address, (v) => v > 0);

      expect(
        await medicalRecord.checkAccess(patient.address, doctor.address)
      ).to.be.true;
    });

    it("Should emit audit log event on grant", async function () {
      await expect(
        medicalRecord.connect(patient).grantAccess(doctor.address)
      ).to.emit(auditLogger, "AccessGranted");
    });

    it("Should allow patient to revoke access", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);

      await expect(
        medicalRecord.connect(patient).revokeAccess(doctor.address)
      )
        .to.emit(medicalRecord, "AccessRevoked")
        .withArgs(patient.address, doctor.address, (v) => v > 0);

      expect(
        await medicalRecord.checkAccess(patient.address, doctor.address)
      ).to.be.false;
    });

    it("Should revert if granting access to non-doctor", async function () {
      await expect(
        medicalRecord.connect(patient).grantAccess(stranger.address)
      ).to.be.revertedWithCustomError(medicalRecord, "NotDoctor");
    });

    it("Should revert if access already granted", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);
      await expect(
        medicalRecord.connect(patient).grantAccess(doctor.address)
      ).to.be.revertedWithCustomError(medicalRecord, "AccessAlreadyGranted");
    });

    it("Should revert if revoking non-existent access", async function () {
      await expect(
        medicalRecord.connect(patient).revokeAccess(doctor.address)
      ).to.be.revertedWithCustomError(medicalRecord, "AccessNotGranted");
    });

    it("Should revert if non-patient grants access", async function () {
      await expect(
        medicalRecord.connect(doctor).grantAccess(doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "NotPatient");
    });

    it("Should increment access grant counter", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);
      await medicalRecord.connect(patient2).grantAccess(doctor.address);
      expect(await medicalRecord.totalAccessGrants()).to.equal(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Record Retrieval
  // ─────────────────────────────────────────────────────────────────

  describe("Record Retrieval", function () {
    beforeEach(async function () {
      // Upload some records
      await medicalRecord
        .connect(patient)
        .uploadRecord("QmHash1", "blood_test.pdf");
      await medicalRecord
        .connect(patient)
        .uploadRecord("QmHash2", "xray_scan.pdf");
    });

    it("Should allow patient to view own records", async function () {
      const records = await medicalRecord
        .connect(patient)
        .getRecords.staticCall(patient.address);
      expect(records.length).to.equal(2);
      expect(records[0].ipfsHash).to.equal("QmHash1");
      expect(records[0].fileName).to.equal("blood_test.pdf");
      expect(records[1].ipfsHash).to.equal("QmHash2");
    });

    it("Should allow authorized doctor to view records", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);

      const records = await medicalRecord
        .connect(doctor)
        .getRecords.staticCall(patient.address);
      expect(records.length).to.equal(2);
    });

    it("Should emit RecordAccessed when doctor views records", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);

      await expect(
        medicalRecord.connect(doctor).getRecords(patient.address)
      ).to.emit(auditLogger, "RecordAccessed");
    });

    it("Should revert if unauthorized user tries to view records", async function () {
      await expect(
        medicalRecord.connect(stranger).getRecords(patient.address)
      ).to.be.revertedWithCustomError(medicalRecord, "NotAuthorized");
    });

    it("Should revert if doctor without access tries to view records", async function () {
      await expect(
        medicalRecord.connect(doctor).getRecords(patient.address)
      ).to.be.revertedWithCustomError(medicalRecord, "NotAuthorized");
    });

    it("Should return correct record count", async function () {
      const count = await medicalRecord
        .connect(patient)
        .getRecordCount(patient.address);
      expect(count).to.equal(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Access List Management
  // ─────────────────────────────────────────────────────────────────

  describe("Access List", function () {
    it("Should return correct access list for patient", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);
      await medicalRecord.connect(patient).grantAccess(doctor2.address);

      const list = await medicalRecord
        .connect(patient)
        .getAccessList(patient.address);
      expect(list.length).to.equal(2);
      expect(list).to.include(doctor.address);
      expect(list).to.include(doctor2.address);
    });

    it("Should update access list after revocation", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);
      await medicalRecord.connect(patient).grantAccess(doctor2.address);
      await medicalRecord.connect(patient).revokeAccess(doctor.address);

      const list = await medicalRecord
        .connect(patient)
        .getAccessList(patient.address);
      expect(list.length).to.equal(1);
      expect(list).to.include(doctor2.address);
    });

    it("Should revert if non-patient queries access list", async function () {
      await expect(
        medicalRecord.connect(doctor).getAccessList(patient.address)
      ).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Doctor-Patient Lookup
  // ─────────────────────────────────────────────────────────────────

  describe("Patients for Doctor", function () {
    it("Should return all patients who granted access to a doctor", async function () {
      await medicalRecord.connect(patient).grantAccess(doctor.address);
      await medicalRecord.connect(patient2).grantAccess(doctor.address);

      const patients = await medicalRecord.getPatientsForDoctor(doctor.address);
      expect(patients.length).to.equal(2);
      expect(patients).to.include(patient.address);
      expect(patients).to.include(patient2.address);
    });

    it("Should return empty array if no patients granted access", async function () {
      const patients = await medicalRecord.getPatientsForDoctor(doctor.address);
      expect(patients.length).to.equal(0);
    });

    it("Should revert for non-doctor address", async function () {
      await expect(
        medicalRecord.getPatientsForDoctor(stranger.address)
      ).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Full Workflow Integration Test
  // ─────────────────────────────────────────────────────────────────

  describe("Full Workflow", function () {
    it("Should complete the entire upload → grant → access → revoke cycle", async function () {
      // 1. Patient uploads a record
      await medicalRecord
        .connect(patient)
        .uploadRecord("QmEncryptedFileHash", "mri_scan.pdf");

      // 2. Patient grants access to doctor
      await medicalRecord.connect(patient).grantAccess(doctor.address);

      // 3. Doctor views the record
      const records = await medicalRecord
        .connect(doctor)
        .getRecords.staticCall(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal("QmEncryptedFileHash");
      expect(records[0].fileName).to.equal("mri_scan.pdf");
      expect(records[0].isActive).to.be.true;

      // 4. Patient revokes access
      await medicalRecord.connect(patient).revokeAccess(doctor.address);

      // 5. Doctor can no longer view records
      await expect(
        medicalRecord.connect(doctor).getRecords(patient.address)
      ).to.be.revertedWithCustomError(medicalRecord, "NotAuthorized");
    });
  });
});
