require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Test DB connection before listening
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    process.exit(1);
  }
  console.log('✅ PostgreSQL connected at:', res.rows[0].now);

  const server = app.listen(PORT, () => {
    console.log(`🚀 Clinic Management Backend API running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      pool.end();
    });
  });
});
