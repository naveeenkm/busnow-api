import { logWarn, logError } from '../config/logger.js';
import { HTTP_NOT_FOUND, HTTP_SERVER_ERROR, MSG_NOT_FOUND, MSG_SERVER_ERROR } from '../constants/index.js';

export const notFound = (req, res) => {
  logWarn('Middleware:notFound - 404', { method: req.method, url: req.originalUrl });
  res.status(HTTP_NOT_FOUND).json({ message: MSG_NOT_FOUND });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || HTTP_SERVER_ERROR;
  logError(`Middleware:errorHandler - ${status}`, { method: req.method, url: req.originalUrl, message: err.message, stack: err.stack });
  res.status(status).json({ message: err.message || MSG_SERVER_ERROR });
};
