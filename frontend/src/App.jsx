import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClinicProvider } from './context/ClinicContext';
import { Layout, ProtectedRoute } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/Patients/PatientList';
import { PatientDetail } from './pages/Patients/PatientDetail';
import { DoctorManagement } from './pages/Doctors/DoctorManagement';
import { StaffManagement } from './pages/Staff/StaffManagement';
import { AppointmentList } from './pages/Appointments/AppointmentList';
import { ConsultationRoom } from './pages/Consultation/ConsultationRoom';
import { BillingList } from './pages/Billing/BillingList';
import { BillingDetail } from './pages/Billing/BillingDetail';
import { PrescriptionReceipt } from './pages/Prescriptions/PrescriptionReceipt';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { ClinicSettings } from './pages/Settings/ClinicSettings';

export default function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated Application routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Patients Directory & Central Profile */}
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:id" element={<PatientDetail />} />

            {/* Appointments */}
            <Route path="appointments" element={<AppointmentList />} />

            {/* Doctor Consultation Room */}
            <Route
              path="consultation/:appointmentId"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ConsultationRoom />
                </ProtectedRoute>
              }
            />

            {/* Billing & Invoices */}
            <Route
              path="billing"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BillingList />
                </ProtectedRoute>
              }
            />
            <Route path="billing/:billId" element={<BillingDetail />} />

            {/* Official Medical Prescription Receipt (Rx) */}
            <Route path="prescriptions/:id" element={<PrescriptionReceipt />} />

            {/* Doctor Management (Admin Only) */}
            <Route
              path="doctors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorManagement />
                </ProtectedRoute>
              }
            />

            {/* Staff / Receptionist Management (Admin Only) */}
            <Route
              path="staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />

            {/* Reports (Admin Only) */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Clinic Details & Branding Settings (ADMIN ONLY) */}
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ClinicSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ClinicProvider>
  </AuthProvider>
  );
}
