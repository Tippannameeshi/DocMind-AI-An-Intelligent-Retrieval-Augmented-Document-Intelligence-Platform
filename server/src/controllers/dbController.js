const { testConnection } = require('../config/db');
const runMigration = require('../sql/migrate');

/**
 * DB Controller for health checks & schema status
 */
const getDatabaseHealth = async (req, res, next) => {
  try {
    const status = await testConnection();
    if (status.connected) {
      return res.status(200).json({
        success: true,
        message: 'PostgreSQL database connection is active.',
        database: status,
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL database connection failed.',
        error: status.error,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * DB Controller to trigger manual database schema migration
 */
const triggerMigration = async (req, res, next) => {
  try {
    await runMigration();
    return res.status(200).json({
      success: true,
      message: 'Database schema migration executed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDatabaseHealth,
  triggerMigration,
};
