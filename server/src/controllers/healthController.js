const config = require('../config');

/**
 * Health check controller method
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Research Paper Assistant API is online and functional.',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
  });
};

module.exports = {
  getHealthStatus,
};
