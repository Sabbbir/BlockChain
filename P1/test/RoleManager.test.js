const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoleManager", function () {
  let roleManager, auditLogger;
  let admin, hospital, doctor, patient, stranger;

  beforeEach(async function () {
    [admin, hospital, doctor, patient, stranger] = await ethers.getSigners();

    // Deploy AuditLogger first
    const AuditLogger = await ethers.getContractFactory("AuditLogger");
    auditLogger = await AuditLogger.deploy();
    await auditLogger.waitForDeployment();

    // Deploy RoleManager with AuditLogger address
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy(await auditLogger.getAddress(), admin.address);
    await roleManager.waitForDeployment();
  });

  // ─────────────────────────────────────────────────────────────────
  // Deployment
  // ─────────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set deployer as admin", async function () {
      const role = await roleManager.getRole(admin.address);
      expect(role).to.equal("ADMIN");
    });

    it("Should mark admin as registered", async function () {
      expect(await roleManager.isRegistered(admin.address)).to.be.true;
    });

    it("Should set the correct AuditLogger address", async function () {
      expect(await roleManager.auditLogger()).to.equal(
        await auditLogger.getAddress()
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Patient Registration
  // ─────────────────────────────────────────────────────────────────

  describe("Patient Registration", function () {
    it("Should allow self-registration as patient", async function () {
      await expect(roleManager.connect(patient).registerPatient())
        .to.emit(roleManager, "PatientRegistered")
        .withArgs(patient.address);

      expect(await roleManager.getRole(patient.address)).to.equal("PATIENT");
      expect(await roleManager.isRegistered(patient.address)).to.be.true;
    });

    it("Should emit UserRegistered audit event", async function () {
      await expect(roleManager.connect(patient).registerPatient())
        .to.emit(auditLogger, "UserRegistered");
    });

    it("Should add patient to role members list", async function () {
      await roleManager.connect(patient).registerPatient();
      const PATIENT_ROLE = await roleManager.PATIENT_ROLE();
      const members = await roleManager.getRoleMembers(PATIENT_ROLE);
      expect(members).to.include(patient.address);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Hospital Registration
  // ─────────────────────────────────────────────────────────────────

  describe("Hospital Registration", function () {
    it("Should allow requesting hospital registration", async function () {
      await expect(
        roleManager.connect(hospital).requestHospitalRegistration()
      )
        .to.emit(roleManager, "HospitalRegistrationRequested")
        .withArgs(hospital.address);

      expect(await roleManager.pendingHospitals(hospital.address)).to.be.true;
    });

    it("Should allow admin to approve hospital", async function () {
      await roleManager.connect(hospital).requestHospitalRegistration();

      await expect(roleManager.connect(admin).approveHospital(hospital.address))
        .to.emit(roleManager, "HospitalApproved")
        .withArgs(hospital.address, admin.address);

      expect(await roleManager.getRole(hospital.address)).to.equal("HOSPITAL");
    });

    it("Should revert approval from non-admin", async function () {
      await roleManager.connect(hospital).requestHospitalRegistration();
      await expect(
        roleManager.connect(stranger).approveHospital(hospital.address)
      ).to.be.reverted;
    });

    it("Should revert if hospital not pending", async function () {
      await expect(
        roleManager.connect(admin).approveHospital(hospital.address)
      ).to.be.revertedWithCustomError(roleManager, "NotPendingHospital");
    });

  });

  // ─────────────────────────────────────────────────────────────────
  // Doctor Registration
  // ─────────────────────────────────────────────────────────────────

  describe("Doctor Registration", function () {
    beforeEach(async function () {
      // Setup: approve a hospital first
      await roleManager.connect(hospital).requestHospitalRegistration();
      await roleManager.connect(admin).approveHospital(hospital.address);
    });

    it("Should allow hospital to register doctor", async function () {
      await expect(
        roleManager.connect(hospital).registerDoctor(doctor.address)
      )
        .to.emit(roleManager, "DoctorRegistered")
        .withArgs(doctor.address, hospital.address);

      expect(await roleManager.getRole(doctor.address)).to.equal("DOCTOR");
    });

    it("Should map doctor to their hospital", async function () {
      await roleManager.connect(hospital).registerDoctor(doctor.address);
      expect(await roleManager.doctorToHospital(doctor.address)).to.equal(
        hospital.address
      );
    });

    it("Should revert if non-hospital tries to register doctor", async function () {
      await expect(
        roleManager.connect(stranger).registerDoctor(doctor.address)
      ).to.be.reverted;
    });

  });

  // ─────────────────────────────────────────────────────────────────
  // System Stats
  // ─────────────────────────────────────────────────────────────────

  describe("System Stats", function () {
    it("Should return correct system statistics", async function () {
      // Register all roles
      await roleManager.connect(patient).registerPatient();
      await roleManager.connect(hospital).requestHospitalRegistration();
      await roleManager.connect(admin).approveHospital(hospital.address);
      await roleManager.connect(hospital).registerDoctor(doctor.address);

      const [admins, hospitals, doctors, patients] =
        await roleManager.getSystemStats();

      expect(admins).to.equal(1);
      expect(hospitals).to.equal(1);
      expect(doctors).to.equal(1);
      expect(patients).to.equal(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────────

  describe("Edge Cases", function () {
    it("Should return NONE for unregistered address", async function () {
      expect(await roleManager.getRole(stranger.address)).to.equal("NONE");
    });

    it("Should show unregistered address as not registered", async function () {
      expect(await roleManager.isRegistered(stranger.address)).to.be.false;
    });
  });
});
