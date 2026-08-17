const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Centralized error handling middleware for Express.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error({
    err,
    url: req.originalUrl,
    method: req.method,
    statusCode,
    code,
  }, `API Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: err.details || null,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Handle 404 Not Found routes
 */
function notFoundHandler(req, res, next) {
  logger.warn({ url: req.originalUrl, method: req.method }, `Route not found`);
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

