const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Automatically map IPv6-only Supabase direct host to IPv4 connection pooler on Vercel/serverless
if (connectionString && connectionString.includes('db.ngatqihxizhxnssqjulk.supabase.co')) {
  connectionString = connectionString
    .replace('postgres:', 'postgres.ngatqihxizhxnssqjulk:')
    .replace('db.ngatqihxizhxnssqjulk.supabase.co:5432', 'aws-0-ap-northeast-2.pooler.supabase.com:6543')
    .replace('db.ngatqihxizhxnssqjulk.supabase.co', 'aws-0-ap-northeast-2.pooler.supabase.com:6543');
}

let pool;

if (connectionString) {
  // Reuse pool across warm serverless function invocations
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString,
      ssl:
        process.env.DB_SSL === 'false' ||
        connectionString.includes('localhost') ||
        connectionString.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
      max: process.env.NODE_ENV === 'production' ? 4 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    global._pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  pool = global._pgPool;
} else {
  pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'clinic_management_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
