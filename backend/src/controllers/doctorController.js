const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');

// Create Doctor (ADMIN ONLY)
exports.createDoctor = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      full_name,
      email,
      phone,
      password,
      specialization,
      qualification,
      registration_number,
      consultation_fee = 500.0,
      available_from = '09:00',
      available_to = '17:00',
    } = req.body;

    if (!full_name || !email || !password || !specialization || !qualification) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, specialization, and qualification are required',
      });
    }

    // Check email uniqueness
    const existing = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    await client.query('BEGIN');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with DOCTOR role
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'DOCTOR') RETURNING id`,
      [full_name.trim(), email.trim().toLowerCase(), phone, passwordHash]
    );
    const userId = userRes.rows[0].id;

    // Create doctor profile
    const docRes = await client.query(
      `INSERT INTO doctors (user_id, specialization, qualification, registration_number, consultation_fee, available_from, available_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        specialization.trim(),
        qualification.trim(),
        registration_number || null,
        consultation_fee,
        available_from,
        available_to,
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Doctor account and profile created successfully',
      doctor: {
        id: docRes.rows[0].id,
        user_id: userId,
        full_name,
        email: email.trim().toLowerCase(),
        phone,
        specialization,
        qualification,
        registration_number,
        consultation_fee,
        available_from,
        available_to,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to create doctor', error: error.message });
  } finally {
    client.release();
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let whereClause = '';
    if (activeOnly === 'true') {
      whereClause = 'WHERE u.is_active = true';
    }

    const result = await query(
      `SELECT d.id, d.user_id, u.full_name, u.email, u.phone, u.is_active,
              d.specialization, d.qualification, d.registration_number,
              d.consultation_fee, d.available_from, d.available_to, d.created_at,
              (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) as total_appointments,
              (SELECT COUNT(*) FROM visits v WHERE v.doctor_id = d.id) as total_visits
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY u.full_name ASC`
    );

    res.json({ success: true, count: result.rows.length, doctors: result.rows });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors', error: error.message });
  }
};

// Get single doctor details
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT d.id, d.user_id, u.full_name, u.email, u.phone, u.is_active,
              d.specialization, d.qualification, d.registration_number,
              d.consultation_fee, d.available_from, d.available_to, d.created_at
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Also get recent appointments for this doctor
    const appointmentsRes = await query(
      `SELECT a.id, a.appointment_date, a.start_time, a.status, a.reason,
              p.id as patient_id, p.patient_code, p.first_name, p.last_name, p.phone as patient_phone
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      doctor: result.rows[0],
      recent_appointments: appointmentsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor', error: error.message });
  }
};

// Update Doctor (ADMIN or the Doctor themselves)
exports.updateDoctor = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      specialization,
      qualification,
      registration_number,
      consultation_fee,
      available_from,
      available_to,
      is_active,
      password,
    } = req.body;

    const docRes = await client.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const userId = docRes.rows[0].user_id;

    // Permissions: Only Admin can update other doctors or change active status
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this doctor profile' });
    }

    await client.query('BEGIN');

    // Update user record
    if (full_name || phone || (typeof is_active === 'boolean' && req.user.role === 'ADMIN')) {
      let activeVal = is_active;
      if (req.user.role !== 'ADMIN') activeVal = undefined;

      await client.query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             is_active = COALESCE($3, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [full_name, phone, activeVal, userId]
      );
    }

    if (password && req.user.role === 'ADMIN') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    }

    // Update doctor record
    await client.query(
      `UPDATE doctors 
       SET specialization = COALESCE($1, specialization),
           qualification = COALESCE($2, qualification),
           registration_number = COALESCE($3, registration_number),
           consultation_fee = COALESCE($4, consultation_fee),
           available_from = COALESCE($5, available_from),
           available_to = COALESCE($6, available_to)
       WHERE id = $7`,
      [specialization, qualification, registration_number, consultation_fee, available_from, available_to, id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Doctor details updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: 'Failed to update doctor', error: error.message });
  } finally {
    client.release();
  }
};
