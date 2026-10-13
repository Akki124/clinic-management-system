const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const staffRoutes = require('./routes/staffRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const visitRoutes = require('./routes/visitRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const billingRoutes = require('./routes/billingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads directory (guarded for serverless environments)
try {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
} catch (err) {
  console.warn('Uploads directory static mount skipped:', err.message);
}

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'Clinic Management API', timestamp: new Date() });
});

// Diagnostic debug endpoint for verifying environment & cloud database on Vercel
app.get(['/api/debug', '/debug'], async (req, res) => {
  let dbStatus = 'untested';
  let dbError = null;
  let serverTime = null;
  try {
    const { pool } = require('./config/database');
    const start = Date.now();
    const result = await pool.query('SELECT NOW()');
    serverTime = result.rows[0].now;
    dbStatus = `connected successfully in ${Date.now() - start}ms`;
  } catch (err) {
    dbStatus = 'connection_failed';
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    environment: {
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      database_host: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/.*@/, '').split('/')[0]
        : 'none',
      has_JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
    database: {
      status: dbStatus,
      serverTime,
      error: dbError,
    },
  });
});

// Mount API routes (with /api and root prefix)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/patients', '/patients'], patientRoutes);
app.use(['/api/doctors', '/doctors'], doctorRoutes);
app.use(['/api/staff', '/staff'], staffRoutes);
app.use(['/api/appointments', '/appointments'], appointmentRoutes);
app.use(['/api/visits', '/visits'], visitRoutes);
app.use(['/api/prescriptions', '/prescriptions'], prescriptionRoutes);
app.use(['/api/bills', '/bills'], billingRoutes);
app.use(['/api/documents', '/documents'], documentRoutes);
app.use(['/api/reports', '/reports'], reportsRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
