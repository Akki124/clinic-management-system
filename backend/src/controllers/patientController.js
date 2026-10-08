const { query, pool } = require('../config/database');

// Helper to generate next unique patient code
async function generatePatientCode() {
  const result = await query(
    `SELECT patient_code FROM patients 
     WHERE patient_code LIKE 'PT-%' 
     ORDER BY id DESC LIMIT 1`
  );
  if (result.rows.length === 0) {
    return 'PT-000101';
  }
  const lastCode = result.rows[0].patient_code;
  const numPart = parseInt(lastCode.replace('PT-', ''), 10);
  const nextNum = isNaN(numPart) ? 101 : numPart + 1;
  return `PT-${String(nextNum).padStart(6, '0')}`;
}

// Register new patient
exports.createPatient = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ success: false, message: 'First name, last name, and phone are required' });
    }

    const patientCode = await generatePatientCode();

    const result = await query(
      `INSERT INTO patients (
        patient_code, first_name, last_name, date_of_birth, gender, phone, email,
        address, blood_group, emergency_contact_name, emergency_contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        patientCode,
        first_name.trim(),
        last_name.trim(),
        date_of_birth || null,
        gender || null,
        phone.trim(),
        email ? email.trim().toLowerCase() : null,
        address || null,
        blood_group || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ success: false, message: 'Failed to register patient', error: error.message });
  }
};

// List all patients with search & pagination
exports.getAllPatients = async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*,
        (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as appointment_count,
        (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) as visit_count,
        (SELECT MAX(appointment_date) FROM appointments a WHERE a.patient_id = p.id) as last_visit_date
      FROM patients p
    `;
    const params = [];

    if (search.trim()) {
      queryText += ` WHERE 
        p.first_name ILIKE $1 OR 
        p.last_name ILIKE $1 OR 
        p.patient_code ILIKE $1 OR 
        p.phone ILIKE $1 OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $1
      `;
      params.push(`%${search.trim()}%`);
    }

    queryText += ` ORDER BY p.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(queryText, params);

    // Also get total count
    let countQuery = 'SELECT COUNT(*) FROM patients p';
    const countParams = [];
    if (search.trim()) {
      countQuery += ` WHERE 
        p.first_name ILIKE $1 OR 
        p.last_name ILIKE $1 OR 
        p.patient_code ILIKE $1 OR 
        p.phone ILIKE $1 OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $1
      `;
      countParams.push(`%${search.trim()}%`);
    }
    const countRes = await query(countQuery, countParams);

    res.json({
      success: true,
      total: parseInt(countRes.rows[0].count, 10),
      patients: result.rows,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patients', error: error.message });
  }
};

// Get Complete Patient Profile (Overview, Appointments, Visits, Prescriptions, Documents, Bills)
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Patient basic info
    const patientRes = await query('SELECT * FROM patients WHERE id = $1', [id]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const patient = patientRes.rows[0];

    // 2. Appointments
    const appointmentsRes = await query(
      `SELECT a.*, 
              d.id as doctor_id, d.specialization, d.consultation_fee,
              u.full_name as doctor_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [id]
    );

    // 3. Visits
    const visitsRes = await query(
      `SELECT v.*, 
              d.id as doctor_id, d.specialization,
              u.full_name as doctor_name
       FROM visits v
       JOIN doctors d ON v.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE v.patient_id = $1
       ORDER BY v.created_at DESC`,
      [id]
    );

    // 4. Prescriptions with Items
    const prescriptionsRes = await query(
      `SELECT pr.*, 
              u.full_name as doctor_name, d.specialization,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pi.id,
                    'medicine_name', pi.medicine_name,
                    'dosage', pi.dosage,
                    'frequency', pi.frequency,
                    'duration', pi.duration,
                    'instructions', pi.instructions
                  )
                ) FILTER (WHERE pi.id IS NOT NULL), '[]'
              ) as items
       FROM prescriptions pr
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.patient_id = $1
       GROUP BY pr.id, u.full_name, d.specialization
       ORDER BY pr.created_at DESC`,
      [id]
    );

    // 5. Bills with Payments
    const billsRes = await query(
      `SELECT b.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pay.id,
                    'amount', pay.amount,
                    'payment_method', pay.payment_method,
                    'transaction_reference', pay.transaction_reference,
                    'payment_date', pay.payment_date
                  )
                ) FILTER (WHERE pay.id IS NOT NULL), '[]'
              ) as payments
       FROM bills b
       LEFT JOIN payments pay ON pay.bill_id = b.id
       WHERE b.patient_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [id]
    );

    // 6. Documents
    const docsRes = await query(
      `SELECT pd.*, u.full_name as uploaded_by_name
       FROM patient_documents pd
       LEFT JOIN users u ON pd.uploaded_by = u.id
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      patient,
      appointments: appointmentsRes.rows,
      visits: visitsRes.rows,
      prescriptions: prescriptionsRes.rows,
      bills: billsRes.rows,
      documents: docsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patient details', error: error.message });
  }
};

// Update Patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    const result = await query(
      `UPDATE patients
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth),
           gender = COALESCE($4, gender),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           address = COALESCE($7, address),
           blood_group = COALESCE($8, blood_group),
           emergency_contact_name = COALESCE($9, emergency_contact_name),
           emergency_contact_phone = COALESCE($10, emergency_contact_phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        blood_group,
        emergency_contact_name,
        emergency_contact_phone,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ success: false, message: 'Failed to update patient', error: error.message });
  }
};
