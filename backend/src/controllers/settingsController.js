const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../config/database');

const os = require('os');

let uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  // Read-only filesystem in serverless environments (Vercel/Lambda) -> fallback to /tmp
  uploadsDir = path.join(os.tmpdir(), 'clinic-uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Fallback uploads directory creation skipped:', e.message);
  }
}

// Multer storage for clinic logo
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `clinic-logo-${Date.now()}${ext}`);
  },
});

const uploadLogoMiddleware = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowedTypes.test(ext) || mime.includes('image')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP, SVG) are allowed'));
    }
  },
}).single('logo');

exports.uploadLogoMiddleware = uploadLogoMiddleware;

// Get Clinic Settings (Public/All authenticated users for receipt and portal branding)
exports.getSettings = async (req, res) => {
  try {
    let result = await query('SELECT * FROM clinic_settings WHERE id = 1');
    if (result.rows.length === 0) {
      // Initialize if empty
      await query(`
        INSERT INTO clinic_settings (id, clinic_name, tagline, phone, email, address, registration_number, website, tax_id, currency_symbol, revisit_validity_days, receipt_footer_note)
        VALUES (1, 'AuraCare Clinic', 'Comprehensive Clinical Practice & Multispeciality OPD', '+91 98000 00000', 'contact@auracareclinic.com', '108 Healthcare Blvd, Central District, Pune, Maharashtra 411001', 'MC-PUN-2024-8891', 'https://auracare.clinic', 'GSTIN-27AAAAA0000A1Z5', '₹', 14, 'Thank you for choosing AuraCare Clinic. Please bring this document for your follow-up consultation.')
        ON CONFLICT (id) DO NOTHING
      `);
      result = await query('SELECT * FROM clinic_settings WHERE id = 1');
    }

    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    res.status(500).json({ success: false, message: 'Failed to load clinic settings', error: error.message });
  }
};

// Update Clinic Settings (ADMIN ONLY)
exports.updateSettings = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM clinic_settings WHERE id = 1');
    const curr = existing.rows[0] || {};

    const clinic_name = req.body.clinic_name !== undefined ? req.body.clinic_name : curr.clinic_name;
    const tagline = req.body.tagline !== undefined ? req.body.tagline : curr.tagline;
    const phone = req.body.phone !== undefined ? req.body.phone : curr.phone;
    const email = req.body.email !== undefined ? req.body.email : curr.email;
    const address = req.body.address !== undefined ? req.body.address : curr.address;
    const registration_number = req.body.registration_number !== undefined ? req.body.registration_number : curr.registration_number;
    const website = req.body.website !== undefined ? req.body.website : curr.website;
    const tax_id = req.body.tax_id !== undefined ? req.body.tax_id : curr.tax_id;
    const currency_symbol = req.body.currency_symbol !== undefined ? req.body.currency_symbol : curr.currency_symbol;
    const revisit_validity_days = req.body.revisit_validity_days !== undefined ? req.body.revisit_validity_days : curr.revisit_validity_days;
    const receipt_footer_note = req.body.receipt_footer_note !== undefined ? req.body.receipt_footer_note : curr.receipt_footer_note;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : curr.logo_url;

    if (!clinic_name || !clinic_name.trim()) {
      return res.status(400).json({ success: false, message: 'Clinic name is required' });
    }

    const result = await query(
      `UPDATE clinic_settings
       SET clinic_name = $1,
           tagline = $2,
           phone = $3,
           email = $4,
           address = $5,
           registration_number = $6,
           website = $7,
           tax_id = $8,
           currency_symbol = $9,
           revisit_validity_days = $10,
           receipt_footer_note = $11,
           logo_url = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        clinic_name.trim(),
        tagline,
        phone,
        email,
        address,
        registration_number,
        website,
        tax_id,
        currency_symbol || '₹',
        revisit_validity_days ? parseInt(revisit_validity_days, 10) : 14,
        receipt_footer_note,
        logo_url,
      ]
    );

    res.json({
      success: true,
      message: 'Clinic details successfully updated',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating clinic settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update clinic settings', error: error.message });
  }
};

// Upload Clinic Logo (ADMIN ONLY)
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo image file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    const result = await query(
      `UPDATE clinic_settings
       SET logo_url = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [logoUrl]
    );

    res.json({
      success: true,
      message: 'Clinic logo updated successfully',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Error uploading clinic logo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload clinic logo', error: error.message });
  }
};

// Delete / Reset Clinic Logo (ADMIN ONLY)
exports.deleteLogo = async (req, res) => {
  try {
    const existing = await query('SELECT logo_url FROM clinic_settings WHERE id = 1');
    if (existing.rows.length > 0 && existing.rows[0].logo_url) {
      const oldPath = path.join(__dirname, '../../', existing.rows[0].logo_url);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Failed to delete old logo file:', e.message);
        }
      }
    }

    const result = await query(
      `UPDATE clinic_settings
       SET logo_url = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`
    );

    res.json({
      success: true,
      message: 'Clinic logo removed successfully',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting clinic logo:', error);
    res.status(500).json({ success: false, message: 'Failed to remove clinic logo', error: error.message });
  }
};
