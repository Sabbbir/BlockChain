const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * Hardhat Ignition Deployment Module
 *
 * Deploys contracts in dependency order:
 *   1. AuditLogger (no dependencies)
 *   2. RoleManager (depends on AuditLogger)
 *   3. MedicalRecord (depends on RoleManager + AuditLogger)
 */
module.exports = buildModule("HealthcareDApp", (m) => {
  // 1. Deploy AuditLogger first (no constructor args)
  const auditLogger = m.contract("AuditLogger");

  // 2. Deploy RoleManager with AuditLogger address and initial admin
  const deployer = m.getAccount(0);
  const roleManager = m.contract("RoleManager", [auditLogger, deployer]);

  // 3. Deploy MedicalRecord with both addresses
  const medicalRecord = m.contract("MedicalRecord", [
    roleManager,
    auditLogger,
  ]);

  return { auditLogger, roleManager, medicalRecord };
});
