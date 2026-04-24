import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logInfo, logWarn } from '../config/logger.js';
import {
  BCRYPT_SALT_ROUNDS, TOKEN_TYPE_REFRESH,
  HTTP_UNAUTHORIZED, HTTP_CONFLICT,
  MSG_EMAIL_ALREADY_REGISTERED, MSG_INVALID_CREDENTIALS, MSG_USER_NOT_FOUND,
} from '../constants/index.js';

export const registerUser = async ({ name, email, password }) => {
  logInfo('Service:registerUser - Processing request', { email });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    logWarn('Service:registerUser - Email already registered', { email });
    return { error: MSG_EMAIL_ALREADY_REGISTERED, status: HTTP_CONFLICT };
  }
  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email, password: hash });
  logInfo('Service:registerUser - Success', { userId: user._id, email });
  return { user };
};

export const authenticateUser = async ({ email, password }) => {
  logInfo('Service:authenticateUser - Processing request', { email });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    logWarn('Service:authenticateUser - User not found', { email });
    return { error: MSG_INVALID_CREDENTIALS, status: HTTP_UNAUTHORIZED };
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    logWarn('Service:authenticateUser - Invalid password', { email });
    return { error: MSG_INVALID_CREDENTIALS, status: HTTP_UNAUTHORIZED };
  }
  logInfo('Service:authenticateUser - Success', { userId: user._id, email });
  return { user };
};

export const refreshUserToken = async (token) => {
  logInfo('Service:refreshUserToken - Processing request');
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  if (payload.type !== TOKEN_TYPE_REFRESH) throw new Error('Invalid token type');
  const user = await User.findById(payload.sub).select('-password');
  if (!user) {
    logWarn('Service:refreshUserToken - User not found', { userId: payload.sub });
    return { error: MSG_USER_NOT_FOUND, status: HTTP_UNAUTHORIZED };
  }
  logInfo('Service:refreshUserToken - Success', { userId: user._id });
  return { user };
};
