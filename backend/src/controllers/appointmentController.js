const { query } = require('../config/database');

const VALID_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

// Book appointment
exports.createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      reason,
      status = 'SCHEDULED',
    } = req.body;

    let finalDocId = doctor_id || req.user.doctor_id;
    if (!finalDocId) {
      const defDoc = await query('SELECT id FROM doctors ORDER BY id ASC LIMIT 1');
      if (defDoc.rows.length > 0) finalDocId = defDoc.rows[0].id;
    }

    if (!patient_id || !finalDocId || !appointment_date || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Patient, Doctor, Appointment Date, and Start Time are required',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    // Verify patient exists
    const patientCheck = await query('SELECT id, first_name, last_name FROM patients WHERE id = $1', [patient_id]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Verify doctor exists
    const docCheck = await query(
      `SELECT d.id, u.full_name, d.consultation_fee 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = $1 AND u.is_active = true`,
      [finalDocId]
    );
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active doctor not found' });
    }

    const createdBy = req.user ? req.user.id : null;

    const result = await query(
      `INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, start_time, end_time, reason, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [patient_id, finalDocId, appointment_date, start_time, end_time || null, reason || null, status, createdBy]
    );

    const appointment = result.rows[0];

    // Also auto-generate an initial draft Bill if status is confirmed or checked-in (optional, or reception can generate later)
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        ...appointment,
        patient_name: `${patientCheck.rows[0].first_name} ${patientCheck.rows[0].last_name}`,
        doctor_name: docCheck.rows[0].full_name,
        consultation_fee: docCheck.rows[0].consultation_fee,
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to book appointment', error: error.message });
  }
};

// List appointments with filtering
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, doctor_id, patient_id, status } = req.query;

    let queryText = `
      SELECT a.*,
             p.patient_code, p.first_name as patient_first_name, p.last_name as patient_last_name,
             p.phone as patient_phone, p.gender as patient_gender, p.blood_group as patient_blood_group,
             p.date_of_birth as patient_dob,
             u.full_name as doctor_name, d.specialization as doctor_specialization,
             d.consultation_fee,
             creator.full_name as created_by_name,
             v.id as visit_id,
             b.id as bill_id, b.bill_number, b.payment_status as bill_status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      LEFT JOIN visits v ON v.appointment_id = a.id
      LEFT JOIN bills b ON b.appointment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // If logged in as Doctor and no specific doctor filter given, default to their doctor_id
    if (req.user && req.user.role === 'DOCTOR' && req.user.doctor_id) {
      params.push(req.user.doctor_id);
      queryText += ` AND a.doctor_id = $${params.length}`;
    } else if (doctor_id) {
      params.push(doctor_id);
      queryText += ` AND a.doctor_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryText += ` AND a.appointment_date = $${params.length}`;
    }

    if (patient_id) {
      params.push(patient_id);
      queryText += ` AND a.patient_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND a.status = $${params.length}`;
    }

    queryText += ` ORDER BY a.appointment_date DESC, a.start_time ASC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      appointments: result.rows,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments', error: error.message });
  }
};

// Get single appointment
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*,
              p.patient_code, p.first_name as patient_first_name, p.last_name as patient_last_name,
              p.phone as patient_phone, p.email as patient_email, p.gender as patient_gender,
              p.blood_group as patient_blood_group, p.date_of_birth as patient_dob,
              u.full_name as doctor_name, d.specialization as doctor_specialization,
              d.consultation_fee,
              creator.full_name as created_by_name,
              v.id as visit_id,
              b.id as bill_id, b.bill_number, b.payment_status as bill_status, b.total_amount as bill_amount
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN users creator ON a.created_by = creator.id
       LEFT JOIN visits v ON v.appointment_id = a.id
       LEFT JOIN bills b ON b.appointment_id = a.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment', error: error.message });
  }
};

// Update Appointment Status (supports optional triage vitals during Check-in)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, blood_pressure, temperature, weight } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const result = await query(
      `UPDATE appointments
       SET status = $1,
           blood_pressure = COALESCE($2, blood_pressure),
           temperature = COALESCE($3, temperature),
           weight = COALESCE($4, weight)
       WHERE id = $5
       RETURNING *`,
      [status, blood_pressure || null, temperature || null, weight || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Reschedule or update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, start_time, end_time, reason, doctor_id, status } = req.body;

    const result = await query(
      `UPDATE appointments
       SET appointment_date = COALESCE($1, appointment_date),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           reason = COALESCE($4, reason),
           doctor_id = COALESCE($5, doctor_id),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [appointment_date, start_time, end_time, reason, doctor_id, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment', error: error.message });
  }
};
