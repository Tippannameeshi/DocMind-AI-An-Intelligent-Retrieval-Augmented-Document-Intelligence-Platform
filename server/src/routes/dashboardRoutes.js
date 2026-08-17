const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);

module.exports = router;
