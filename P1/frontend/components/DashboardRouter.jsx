"use client";

import { useWeb3 } from "../contexts/Web3Context";
import PatientDashboard from "./dashboards/PatientDashboard";
import DoctorDashboard from "./dashboards/DoctorDashboard";
import HospitalDashboard from "./dashboards/HospitalDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

/**
 * Routes to the correct dashboard based on the user's on-chain role.
 */
export default function DashboardRouter() {
  const { role } = useWeb3();

  switch (role) {
    case "PATIENT":
      return <PatientDashboard />;
    case "DOCTOR":
      return <DoctorDashboard />;
    case "HOSPITAL":
      return <HospitalDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Unknown Role</h2>
            <p className="text-surface-200/50">
              Your account role &ldquo;{role}&rdquo; is not recognized.
            </p>
          </div>
        </div>
      );
  }
}
