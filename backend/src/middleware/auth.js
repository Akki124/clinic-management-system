const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinic_secret_key');
    
    // Check user active status in database
    const userRes = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.phone, u.is_active, d.id as doctor_id 
       FROM users u 
       LEFT JOIN doctors d ON d.user_id = u.id 
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'User account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

module.exports = authenticateToken;
