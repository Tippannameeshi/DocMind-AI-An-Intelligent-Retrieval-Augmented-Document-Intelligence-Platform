const express = require('express');
const { getDatabaseHealth, triggerMigration } = require('../controllers/dbController');

const router = express.Router();

/**
 * @route GET /api/db/health
 * @desc  Check PostgreSQL pool health
 * @access Public
 */
router.get('/health', getDatabaseHealth);

/**
 * @route POST /api/db/migrate
 * @desc  Run manual schema migration
 * @access Development / System Admin
 */
router.post('/migrate', triggerMigration);

module.exports = router;
