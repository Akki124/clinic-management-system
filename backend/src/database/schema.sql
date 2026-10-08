-- Clinic Management System PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    available_from VARCHAR(10) DEFAULT '09:00',
    available_to VARCHAR(10) DEFAULT '17:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    blood_group VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10),
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' 
        CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    blood_pressure VARCHAR(50),
    temperature VARCHAR(50),
    weight VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    chief_complaint TEXT NOT NULL,
    associated_complaints TEXT,
    past_history TEXT,
    family_history TEXT,
    appetite VARCHAR(150),
    thirst VARCHAR(150),
    desire TEXT,
    aversion TEXT,
    thermal_state VARCHAR(150),
    disagree TEXT,
    allergy TEXT,
    stool TEXT,
    urine TEXT,
    sleep TEXT,
    dreams TEXT,
    habit TEXT,
    menstrual_history TEXT,
    obstetric_history TEXT,
    weight VARCHAR(50),
    pulse VARCHAR(50),
    tongue TEXT,
    conjunctiva TEXT,
    height VARCHAR(50),
    blood_pressure VARCHAR(50),
    temperature VARCHAR(50),
    nail TEXT,
    cvs TEXT,
    cns TEXT,
    rs TEXT,
    git TEXT,
    mental_symptoms TEXT,
    lab_investigation TEXT,
    diagnosis TEXT NOT NULL,
    totality_of_symptoms TEXT,
    treatment_dose TEXT,
    doctor_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT
);

CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID' 
        CHECK (payment_status IN ('PAID', 'PARTIAL', 'UNPAID')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL 
        CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE', 'OTHER')),
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patient_documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);

-- Clinic Profile & Customization Settings (Admin Exclusive)
CREATE TABLE IF NOT EXISTS clinic_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    clinic_name VARCHAR(255) NOT NULL DEFAULT 'AuraCare Clinic',
    tagline VARCHAR(255) DEFAULT 'Comprehensive Clinical Practice & Multispeciality OPD',
    phone VARCHAR(50) DEFAULT '+91 98000 00000',
    email VARCHAR(255) DEFAULT 'contact@auracareclinic.com',
    address TEXT DEFAULT '108 Healthcare Blvd, Central District, Pune, Maharashtra 411001',
    registration_number VARCHAR(100) DEFAULT 'MC-PUN-2024-8891',
    logo_url TEXT DEFAULT NULL,
    website VARCHAR(255) DEFAULT 'https://auracare.clinic',
    tax_id VARCHAR(100) DEFAULT 'GSTIN-27AAAAA0000A1Z5',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    revisit_validity_days INTEGER DEFAULT 14,
    receipt_footer_note TEXT DEFAULT 'Thank you for choosing AuraCare Clinic. Please bring this document for your follow-up consultation.',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO clinic_settings (id, clinic_name, tagline, phone, email, address, registration_number, logo_url, website, tax_id, currency_symbol, revisit_validity_days, receipt_footer_note)
VALUES (1, 'AuraCare Clinic', 'Comprehensive Clinical Practice & Multispeciality OPD', '+91 98000 00000', 'contact@auracareclinic.com', '108 Healthcare Blvd, Central District, Pune, Maharashtra 411001', 'MC-PUN-2024-8891', NULL, 'https://auracare.clinic', 'GSTIN-27AAAAA0000A1Z5', '₹', 14, 'Thank you for choosing AuraCare Clinic. Please bring this document for your follow-up consultation.')
ON CONFLICT (id) DO NOTHING;
