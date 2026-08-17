const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/db');

async function runMigration() {
  console.log('🚀 Running PostgreSQL schema migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    // Run schema.sql statements
    await query(sql);
    console.log('✅ Schema migration executed successfully.');

    // Verify created tables
    const tableRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log('📋 Existing database tables:', tableNames.join(', '));

    // Verify pgvector extension
    const extRes = await query(`SELECT extname FROM pg_extension WHERE extname = 'vector';`);
    if (extRes.rows.length > 0) {
      console.log('⚡ pgvector extension is enabled.');
    } else {
      console.warn('⚠️ Warning: pgvector extension could not be verified.');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
    console.log('👋 Database connection closed.');
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
