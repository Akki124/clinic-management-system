const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await query(
      `SELECT u.*, d.id as doctor_id, d.specialization, d.qualification, d.consultation_fee 
       FROM users u 
       LEFT JOIN doctors d ON d.user_id = u.id 
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Doctor and Receptionist logins are disabled. All access is reserved for the Administrator.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Clinic Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      doctor_id: user.doctor_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'clinic_secret_key', {
      expiresIn: '24h',
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctor_id: user.doctor_id,
        specialization: user.specialization,
        qualification: user.qualification,
        consultation_fee: user.consultation_fee,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Database/Server error: ' + error.message,
      error: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};
