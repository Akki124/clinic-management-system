const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function migrateAndSeed() {
  console.log('🔄 Starting database migration and seeding...');

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Tables created or verified successfully.');

    // Check if admin user already exists
    const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@clinic.com'");
    if (adminCheck.rows.length === 0) {
      console.log('🌱 Seeding initial demo data...');
      
      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('Admin@123', salt);
      const doctorPass = await bcrypt.hash('Doctor@123', salt);
      const staffPass = await bcrypt.hash('Reception@123', salt);

      // 1. Insert Admin
      const adminRes = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Dr. Alexander Wright', 'admin@clinic.com', '+91 98000 00001', adminPass, 'ADMIN']
      );
      const adminId = adminRes.rows[0].id;

      // 2. Insert Receptionists
      const rec1Res = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Priya Deshmukh', 'reception@clinic.com', '+91 98000 00002', staffPass, 'RECEPTIONIST']
      );
      const rec1Id = rec1Res.rows[0].id;

      const rec2Res = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Kavita Nair', 'staff@clinic.com', '+91 98000 00003', staffPass, 'RECEPTIONIST']
      );

      // 3. Insert Doctors (User + Doctor record)
      const docUser1 = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Dr. Rajesh Sharma', 'dr.sharma@clinic.com', '+91 98000 00011', doctorPass, 'DOCTOR']
      );
      const doc1 = await pool.query(
        `INSERT INTO doctors (user_id, specialization, qualification, registration_number, consultation_fee, available_from, available_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [docUser1.rows[0].id, 'Cardiology', 'MD, DM (Cardiology)', 'MCI-28491', 750.00, '09:00', '16:00']
      );
      const doc1Id = doc1.rows[0].id;

      const docUser2 = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Dr. Ananya Patil', 'dr.patil@clinic.com', '+91 98000 00012', doctorPass, 'DOCTOR']
      );
      const doc2 = await pool.query(
        `INSERT INTO doctors (user_id, specialization, qualification, registration_number, consultation_fee, available_from, available_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [docUser2.rows[0].id, 'General Medicine', 'MBBS, MD (Internal Med)', 'MCI-59203', 500.00, '10:00', '18:00']
      );
      const doc2Id = doc2.rows[0].id;

      const docUser3 = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Dr. David Chen', 'dr.chen@clinic.com', '+91 98000 00013', doctorPass, 'DOCTOR']
      );
      const doc3 = await pool.query(
        `INSERT INTO doctors (user_id, specialization, qualification, registration_number, consultation_fee, available_from, available_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [docUser3.rows[0].id, 'Pediatrics', 'MBBS, DCH', 'MCI-71822', 600.00, '09:30', '15:30']
      );
      const doc3Id = doc3.rows[0].id;

      // 4. Insert Patients
      const p1 = await pool.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        ['PT-000101', 'Rahul', 'Patil', '1988-04-12', 'Male', '9876543210', 'rahul.patil@example.com', 'Flat 402, Sunshine Heights, Pune', 'B+', 'Suresh Patil', '9876543211']
      );
      const p1Id = p1.rows[0].id;

      const p2 = await pool.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        ['PT-000102', 'Sunita', 'Verma', '1995-09-23', 'Female', '9822334455', 'sunita.v@example.com', '12 Lake View Road, Pune', 'O+', 'Ramesh Verma', '9822334456']
      );
      const p2Id = p2.rows[0].id;

      const p3 = await pool.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        ['PT-000103', 'Aarav', 'Mehta', '2018-06-15', 'Male', '9811223344', 'mehta.family@example.com', 'B-14 Green Meadows, Pune', 'A+', 'Pooja Mehta', '9811223345']
      );
      const p3Id = p3.rows[0].id;

      const p4 = await pool.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        ['PT-000104', 'Meera', 'Joshi', '1974-11-03', 'Female', '9844556677', 'meera.joshi@example.com', '78 Heritage Park, Pune', 'AB+', 'Anil Joshi', '9844556678']
      );
      const p4Id = p4.rows[0].id;

      const p5 = await pool.query(
        `INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        ['PT-000105', 'Vikram', 'Singh', '1982-01-20', 'Male', '9877889900', 'vikram.singh@example.com', 'Plot 55, Shivaji Nagar, Pune', 'O-', 'Neelam Singh', '9877889901']
      );
      const p5Id = p5.rows[0].id;

      // Current today date in ISO (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // 5. Insert Appointments
      // Appointment 1: Completed visit with Dr. Sharma
      const app1 = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p1Id, doc1Id, yesterday, '10:00', '10:30', 'Chest tightness and shortness of breath', 'COMPLETED', rec1Id]
      );
      const app1Id = app1.rows[0].id;

      // Appointment 2: Checked In (waiting for Dr. Patil)
      const app2 = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p2Id, doc2Id, today, '10:30', '11:00', 'Persistent high fever, severe headache and body aches', 'CHECKED_IN', rec1Id]
      );
      const app2Id = app2.rows[0].id;

      // Appointment 3: Confirmed with Dr. Sharma today
      const app3 = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p4Id, doc1Id, today, '14:00', '14:30', 'Routine cardiac blood pressure evaluation', 'CONFIRMED', rec1Id]
      );

      // Appointment 4: Scheduled for child with Dr. Chen tomorrow
      const app4 = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p3Id, doc3Id, tomorrow, '11:00', '11:30', 'Childhood immunization & growth checkup', 'SCHEDULED', rec1Id]
      );

      // Appointment 5: Completed past visit for Rahul with Dr. Patil
      const pastDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const app5 = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [p1Id, doc2Id, pastDate, '11:30', '12:00', 'Severe seasonal allergy and sneezing', 'COMPLETED', rec1Id]
      );
      const app5Id = app5.rows[0].id;

      // 6. Insert Visits
      const visit1 = await pool.query(
        `INSERT INTO visits (appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, doctor_notes, blood_pressure, temperature, weight, follow_up_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          app1Id,
          p1Id,
          doc1Id,
          'Mild chest tightness on exertion for 3 days',
          'Stage 1 Essential Hypertension with mild angina pectoris',
          'Patient advised lifestyle modification, low salt diet, and regular 30 min brisk walk. ECG showed normal sinus rhythm with mild LV strain.',
          '142/90 mmHg',
          '98.4 F',
          '76 kg',
          new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
        ]
      );
      const visit1Id = visit1.rows[0].id;

      const visit5 = await pool.query(
        `INSERT INTO visits (appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, doctor_notes, blood_pressure, temperature, weight, follow_up_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          app5Id,
          p1Id,
          doc2Id,
          'Runny nose, sneezing, itchy eyes',
          'Allergic Rhinitis (Seasonal)',
          'Clear nasal discharge. Prescribed antihistamines and saline nasal spray.',
          '120/80 mmHg',
          '98.6 F',
          '75 kg',
          null
        ]
      );
      const visit5Id = visit5.rows[0].id;

      // 7. Insert Prescriptions & Prescription Items
      const pres1 = await pool.query(
        `INSERT INTO prescriptions (visit_id, patient_id, doctor_id, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [visit1Id, p1Id, doc1Id, 'Take medications strictly on schedule. Monitor BP daily morning and evening.']
      );
      const pres1Id = pres1.rows[0].id;

      await pool.query(
        `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES 
         ($1, 'Telmisartan', '40mg', '1-0-0 (Morning)', '30 days', 'Take after breakfast with water'),
         ($1, 'Amlodipine', '5mg', '0-0-1 (Night)', '30 days', 'Take before bedtime'),
         ($1, 'Aspirin (Ecosprin)', '75mg', '0-1-0 (Afternoon)', '30 days', 'Take strictly after meals')`,
        [pres1Id]
      );

      const pres5 = await pool.query(
        `INSERT INTO prescriptions (visit_id, patient_id, doctor_id, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [visit5Id, p1Id, doc2Id, 'Avoid dust exposure. Use warm water for gargling.']
      );
      const pres5Id = pres5.rows[0].id;

      await pool.query(
        `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES 
         ($1, 'Levocetirizine', '5mg', '0-0-1 (Night)', '7 days', 'May cause drowsiness, avoid driving'),
         ($1, 'Fluticasone Nasal Spray', '50mcg', '1 spray each nostril BID', '14 days', 'Blow nose before spraying')`,
        [pres5Id]
      );

      // 8. Insert Bills & Payments
      const bill1 = await pool.query(
        `INSERT INTO bills (patient_id, appointment_id, bill_number, subtotal, discount, tax, total_amount, payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [p1Id, app1Id, 'INV-2026-00101', 750.00, 0.00, 37.50, 787.50, 'PAID', 'Cardiology initial consultation + ECG interpretation']
      );
      const bill1Id = bill1.rows[0].id;

      await pool.query(
        `INSERT INTO payments (bill_id, amount, payment_method, transaction_reference, received_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [bill1Id, 787.50, 'UPI', 'UPI-TXN-99881122', rec1Id]
      );

      const bill2 = await pool.query(
        `INSERT INTO bills (patient_id, appointment_id, bill_number, subtotal, discount, tax, total_amount, payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [p2Id, app2Id, 'INV-2026-00102', 500.00, 50.00, 22.50, 472.50, 'UNPAID', 'General Medicine consultation (Checked In)']
      );

      console.log('✅ Demo data seeded successfully with Admin, Doctors, Staff, Patients, Visits, Prescriptions, and Bills.');
    } else {
      console.log('ℹ️ Admin user already exists. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Migration / Seed Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrateAndSeed().then(() => {
    console.log('Database setup completed.');
  });
}

module.exports = migrateAndSeed;
