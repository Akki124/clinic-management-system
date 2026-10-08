const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// Create Staff / Receptionist (ADMIN ONLY)
exports.createStaff = async (req, res) => {
  try {
    const { full_name, email, phone, password, role = 'RECEPTIONIST' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!['RECEPTIONIST', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role' });
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, phone, role, is_active, created_at`,
      [full_name.trim(), email.trim().toLowerCase(), phone, passwordHash, role]
    );

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      staff: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff member', error: error.message });
  }
};

// Get all staff (ADMIN ONLY)
exports.getAllStaff = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, is_active, created_at, updated_at
       FROM users
       WHERE role IN ('RECEPTIONIST', 'ADMIN')
       ORDER BY created_at DESC`
    );

    res.json({ success: true, count: result.rows.length, staff: result.rows });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff members', error: error.message });
  }
};

// Update Staff (ADMIN ONLY)
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, is_active, password, role } = req.body;

    const userRes = await query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           is_active = COALESCE($3, is_active),
           role = COALESCE($4, role),
           password_hash = COALESCE($5, password_hash),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [full_name, phone, is_active, role, passwordHash, id]
    );

    res.json({ success: true, message: 'Staff member updated successfully' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ success: false, message: 'Failed to update staff member', error: error.message });
  }
};
