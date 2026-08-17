const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info({
    port: PORT,
    env: config.env,
    swaggerDocs: `http://127.0.0.1:${PORT}/api-docs`,
  }, `🚀 RAG Assistant Server running on http://127.0.0.1:${PORT}`);
});

// Configure keepAliveTimeout and headersTimeout to prevent ECONNRESET in reverse proxies like Vite
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Promise Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
});
