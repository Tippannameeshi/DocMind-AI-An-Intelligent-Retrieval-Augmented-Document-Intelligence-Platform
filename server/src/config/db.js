const { Pool } = require('pg');
const config = require('./index');

// Create PostgreSQL Connection Pool using raw pg driver
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: 20, // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute single SQL query
 * @param {string} text - SQL Query string
 * @param {Array} params - Parameters array
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.env === 'development') {
      console.log(`[DB Query] executed in ${duration}ms | rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error(`[DB Error] SQL Query Failed: ${text}`, err.message);
    throw err;
  }
};

/**
 * Get a client from the pool for manual transaction management (BEGIN/COMMIT/ROLLBACK)
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Health check utility to verify active database connectivity
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now, version() as version;');
    return {
      connected: true,
      timestamp: result.rows[0].now,
      version: result.rows[0].version,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
