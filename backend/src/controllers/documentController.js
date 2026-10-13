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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.uploadMiddleware = upload.single('file');

exports.uploadDocument = async (req, res) => {
  try {
    const { patient_id, visit_id, document_type = 'Lab Report' } = req.body;

    if (!patient_id) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await query(
      `INSERT INTO patient_documents (
        patient_id, visit_id, document_type, file_url, original_filename, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        patient_id,
        visit_id || null,
        document_type,
        fileUrl,
        req.file.originalname,
        req.user ? req.user.id : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Medical document uploaded successfully',
      document: result.rows[0],
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document', error: error.message });
  }
};

exports.getPatientDocuments = async (req, res) => {
  try {
    const { id } = req.params; // patient_id
    const result = await query(
      `SELECT pd.*, u.full_name as uploaded_by_name
       FROM patient_documents pd
       LEFT JOIN users u ON pd.uploaded_by = u.id
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      documents: result.rows,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};
