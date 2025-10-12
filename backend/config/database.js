// backend/config/database.js
const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 DNS resolution to avoid IPv6 DNS delays
dns.setDefaultResultOrder('ipv4first');

// 💡 IMPORTANT: Use Supabase Connection Pooling (port 6543) for better stability!
// DATABASE_URL should look like:
// postgresql://postgres:password@db-pool.xxx.supabase.co:6543/postgres
// NOT: db.xxx.supabase.co:5432 (direct connection)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=UTC',

  max: 10,                    // up to 10 connections
  idleTimeoutMillis: 30000,   // auto-close idle after 30s (important!)
  connectionTimeoutMillis: 30000, // fail if not connected in 30s
  query_timeout: 60000,       // 60s per query
  statement_timeout: 60000,   // 60s per statement
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Pool event monitoring
pool.on('connect', () => console.log('✅ PostgreSQL connected'));
pool.on('remove', () => console.log('🔌 PostgreSQL connection closed'));
pool.on('error', err => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Initial test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ Error connecting to database:', err.message);
  }
})();

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`🛑 Shutting down gracefully (${signal})...`);
    await pool.end();
    process.exit(0);
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
