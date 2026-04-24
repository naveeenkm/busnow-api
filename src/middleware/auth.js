import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { logWarn } from '../config/logger.js';
import {
  HTTP_UNAUTHORIZED, HTTP_FORBIDDEN, HTTP_BAD_REQUEST,
  TOKEN_TYPE_ACCESS, ROLE_ADMIN,
  MSG_UNAUTHORIZED, MSG_INVALID_TOKEN_TYPE, MSG_USER_NOT_FOUND,
  MSG_INVALID_REFRESH_TOKEN, MSG_ADMIN_REQUIRED,
} from '../constants/index.js';

export const auth = (required = true) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) {
        logWarn('Middleware:auth - No token', { method: req.method, url: req.originalUrl });
        return res.status(HTTP_UNAUTHORIZED).json({ message: MSG_UNAUTHORIZED });
      }
      return next();
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== TOKEN_TYPE_ACCESS) {
      logWarn('Middleware:auth - Invalid token type', { method: req.method, url: req.originalUrl });
      return res.status(HTTP_UNAUTHORIZED).json({ message: MSG_INVALID_TOKEN_TYPE });
    }
    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      logWarn('Middleware:auth - User not found', { userId: payload.sub, method: req.method, url: req.originalUrl });
      return res.status(HTTP_UNAUTHORIZED).json({ message: MSG_USER_NOT_FOUND });
    }
    req.user = user;
    next();
  } catch {
    if (required) {
      logWarn('Middleware:auth - Invalid/expired token', { method: req.method, url: req.originalUrl });
      return res.status(HTTP_UNAUTHORIZED).json({ message: MSG_INVALID_REFRESH_TOKEN });
    }
    next();
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLE_ADMIN) {
    logWarn('Middleware:adminOnly - Access denied', { userId: req.user?._id, role: req.user?.role, method: req.method, url: req.originalUrl });
    return res.status(HTTP_FORBIDDEN).json({ message: MSG_ADMIN_REQUIRED });
  }
  next();
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    logWarn('Middleware:validateObjectId - Invalid ID', { param: paramName, value: req.params[paramName], method: req.method, url: req.originalUrl });
    return res.status(HTTP_BAD_REQUEST).json({ message: `Invalid ${paramName}` });
  }
  next();
};
