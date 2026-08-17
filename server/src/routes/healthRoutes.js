const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc  Health check endpoint
 * @access Public
 */
router.get('/', getHealthStatus);

module.exports = router;
