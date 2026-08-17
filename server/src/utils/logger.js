const pino = require('pino');
const config = require('../config');

const isDev = config.env !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: { env: config.env },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['headers.authorization', 'password', 'req.headers.authorization'],
});

module.exports = logger;
