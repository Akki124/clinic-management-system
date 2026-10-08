const { query, pool } = require('../config/database');

// Create Prescription with Items
exports.createPrescription = async (req, res) => {
  const client = await pool.connect();
  try {
    const { visit_id, patient_id, doctor_id, notes, items } = req.body;

    if (!patient_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and at least one medicine item are required',
      });
    }

    let finalDoctorId = doctor_id;
    if (!finalDoctorId && req.user.role === 'DOCTOR') {
      finalDoctorId = req.user.doctor_id;
    }

    if (!finalDoctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }

    await client.query('BEGIN');

    const presRes = await client.query(
      `INSERT INTO prescriptions (visit_id, patient_id, doctor_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [visit_id || null, patient_id, finalDoctorId, notes || null]
    );
    const prescription = presRes.rows[0];

    const insertedItems = [];
    for (const item of items) {
      if (item.medicine_name) {
        const itemRes = await client.query(
          `INSERT INTO prescription_items (
            prescription_id, medicine_name, dosage, frequency, duration, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            prescription.id,
            item.medicine_name.trim(),
            item.dosage ? item.dosage.trim() : 'As directed',
            item.frequency ? item.frequency.trim() : '1-0-1',
            item.duration ? item.duration.trim() : '5 days',
            item.instructions ? item.instructions.trim() : null,
          ]
        );
        insertedItems.push(itemRes.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      prescription: {
        ...prescription,
        items: insertedItems,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to create prescription', error: error.message });
  } finally {
    client.release();
  }
};

// Get prescriptions for patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { id } = req.params; // patient_id

    const result = await query(
      `SELECT pr.*,
              u.full_name as doctor_name, d.specialization as doctor_specialization,
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

    res.json({
      success: true,
      count: result.rows.length,
      prescriptions: result.rows,
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: error.message });
  }
};

// Get single prescription by ID with patient, doctor, vitals, diagnosis & medication items
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT pr.*,
              p.id as patient_id, p.patient_code, p.first_name as patient_first_name, p.last_name as patient_last_name,
              p.date_of_birth as patient_dob, p.gender as patient_gender, p.phone as patient_phone,
              p.blood_group as patient_blood_group, p.address as patient_address,
              d.id as doctor_id, d.specialization as doctor_specialization,
              d.qualification as doctor_qualification, d.registration_number as doctor_reg_no,
              u.full_name as doctor_name, u.email as doctor_email, u.phone as doctor_phone,
              v.chief_complaint, v.associated_complaints, v.diagnosis, v.doctor_notes,
              v.blood_pressure, v.temperature, v.weight, v.pulse, v.height,
              v.mental_symptoms, v.totality_of_symptoms, v.treatment_dose,
              v.follow_up_date, v.appointment_id
       FROM prescriptions pr
       JOIN patients p ON pr.patient_id = p.id
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN visits v ON pr.visit_id = v.id
       WHERE pr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = result.rows[0];

    const itemsRes = await query(
      `SELECT id, medicine_name, dosage, frequency, duration, instructions
       FROM prescription_items
       WHERE prescription_id = $1
       ORDER BY id ASC`,
      [id]
    );

    prescription.items = itemsRes.rows;

    res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescription', error: error.message });
  }
};
