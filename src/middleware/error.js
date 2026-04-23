import logger from '../config/logger.js';

export const notFound = (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Not found' });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  logger.error(`${status} ${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });
  res.status(status).json({ message: err.message || 'Server error' });
};
