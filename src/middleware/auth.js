import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const auth = (required = true) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) {
        logger.warn(`Auth failed: no token — ${req.method} ${req.originalUrl}`);
        return res.status(401).json({ message: 'Unauthorized' });
      }
      return next();
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'access') {
      logger.warn(`Auth failed: invalid token type — ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Invalid token type' });
    }
    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      logger.warn(`Auth failed: user not found (${payload.sub}) — ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    if (required) {
      logger.warn(`Auth failed: invalid/expired token — ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next();
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Admin access denied for user ${req.user?._id} — ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
