# AuraCare Clinic Management System

A production-grade Clinic Management System built with **React (Vite + Tailwind CSS)**, **Node.js / Express REST API**, and **PostgreSQL**.

---

## 🏛 Architecture Overview

```
                      ┌─────────────┐
                      │  React UI   │ (Port 3000)
                      └──────┬──────┘
                             │ REST API / JWT
                             ▼
                  ┌────────────────────┐
                  │ Node.js + Express  │ (Port 5001)
                  └─────────┬──────────┘
                            │
           ┌────────────────┼─────────────────┐
           │                │                 │
           ▼                ▼                 ▼
    Authentication    Business Logic     File Storage
    & RBAC (3 Roles)  & Validation       (/uploads)
           │                │
           └────────┬───────┘
                    ▼
              ┌────────────┐
              │ PostgreSQL │ (Port 5432, clinic_management_db)
              └────────────┘
```

---

## 👥 User Roles & Access Control

| Role | Access Permissions |
|---|---|
| **ADMIN** | Only role authorized to create **new Doctors** (with user account credentials & fees) and **new Receptionists / Staff**. Full access to all patients, appointments, billing, and executive analytics reports. |
| **DOCTOR** | View assigned patient appointments, access patient medical history, conduct OPD consultations (record Vitals, Chief Complaint, Diagnosis, Notes), and issue electronic prescriptions with itemized medications. |
| **RECEPTIONIST** | Register new patients (auto-generates `PT-XXXXXX` code), book and manage appointments, advance workflow status (`SCHEDULED` → `CONFIRMED` → `CHECKED_IN`), generate bills, and record counter payments (Cash, Card, UPI). |

---

## 🔑 Pre-Configured Demo Accounts

On the `/login` page, you can use the **One-Click Demo Login** buttons or enter the credentials below:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@clinic.com` | `Admin@123` | Dr. Alexander Wright (Super Admin) |
| **Doctor (Cardiology)** | `dr.sharma@clinic.com` | `Doctor@123` | Dr. Rajesh Sharma, MD, DM |
| **Doctor (General Med)** | `dr.patil@clinic.com` | `Doctor@123` | Dr. Ananya Patil, MBBS, MD |
| **Receptionist** | `reception@clinic.com` | `Reception@123` | Priya Deshmukh (Front Desk) |

---

## 🗄 PostgreSQL Schema

The database `clinic_management_db` contains:

1. **`users`**: Authentication credentials, roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`), activation status.
2. **`doctors`**: Linked to `users.id`, specialization, qualifications, registration number, consultation fee, available OPD hours.
3. **`patients`**: Demographics, unique `patient_code` (`PT-000101`), contact, blood group, emergency contacts.
4. **`appointments`**: Patient & Doctor reference, date, time slots, reason, and status progression (`SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`, `CANCELLED`, `NO_SHOW`).
5. **`visits`**: Clinical consultation records, chief complaint, diagnosis, doctor notes, vitals (BP, temperature, weight), follow-up date.
6. **`prescriptions`**: Linked to visit/patient/doctor with doctor advice notes.
7. **`prescription_items`**: Medicine name, dosage, frequency (e.g. `1-0-1`), duration, and specific instructions.
8. **`bills`**: Itemized invoice (`INV-YYYY-XXXXXX`), subtotal, discount, tax, total, and status (`PAID`, `PARTIAL`, `UNPAID`).
9. **`payments`**: Transaction records, payment method (`CASH`, `CARD`, `UPI`, `ONLINE`), reference ID, received by staff.
10. **`patient_documents`**: Uploaded diagnostic scans, blood test reports, and PDFs.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running on port 5432)

### 1. Database Setup
```bash
cd backend
# Database creation (if not already created):
# CREATE DATABASE clinic_management_db;
npm run migrate
```

### 2. Start the Backend API (Port 5001)
```bash
cd backend
npm start
```
API Health Check: `http://localhost:5001/api/health`

### 3. Start the Frontend React Client (Port 3000)
```bash
cd frontend
npm run dev -- --port 3000
```
Open your browser to: `http://localhost:3000`

---

## 📄 Key Application Routes

- `/login` - Role login with 1-click credential selector
- `/dashboard` - Live OPD console tailored to active user role
- `/patients` - Searchable patient directory & registration modal
- `/patients/:id` - 360° Central Patient Profile (Overview, Appointments, Visits, Prescriptions, Documents, Bills)
- `/appointments` - Appointments schedule & status progression
- `/consultation/:appointmentId` - Doctor consultation room with electronic prescription builder
- `/doctors` - Admin portal to create doctors and assign credentials
- `/staff` - Admin portal to create receptionists and manage staff
- `/billing` - Invoicing table with payment recorder
- `/billing/:billId` - Printable tax invoice & payment receipt
- `/reports` - Admin clinical analytics and revenue breakdown
