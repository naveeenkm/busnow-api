import { signAccessToken, signRefreshToken } from '../services/token.service.js';
import { registerUser, authenticateUser, refreshUserToken } from '../services/auth.service.js';
import { logInfo, logWarn, logError } from '../config/logger.js';
import {
  HTTP_OK, HTTP_CREATED, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_SERVER_ERROR,
  REFRESH_COOKIE_NAME, REFRESH_COOKIE_MAX_AGE, MIN_PASSWORD_LENGTH,
  MSG_ALL_FIELDS_REQUIRED, MSG_PASSWORD_TOO_SHORT, MSG_EMAIL_PASSWORD_REQUIRED,
  MSG_NO_REFRESH_TOKEN, MSG_INVALID_REFRESH_TOKEN, MSG_LOGGED_OUT, MSG_SERVER_ERROR,
} from '../constants/index.js';

const isProd = process.env.NODE_ENV === 'production';

const CLEAR_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

const REFRESH_COOKIE_OPTS = {
  ...CLEAR_COOKIE_OPTS,
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

const sendTokens = (res, user, status = HTTP_OK) =>
  res
    .status(status)
    .cookie(REFRESH_COOKIE_NAME, signRefreshToken(user), REFRESH_COOKIE_OPTS)
    .json({ accessToken: signAccessToken(user), user });

export const register = async (req, res) => {
  try {
    logInfo('Controller:register - Request received', { email: req.body.email });
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_ALL_FIELDS_REQUIRED });
    if (password.length < MIN_PASSWORD_LENGTH) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_PASSWORD_TOO_SHORT });
    const result = await registerUser({ name, email, password });
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:register - Success', { userId: result.user._id });
    sendTokens(res, result.user, HTTP_CREATED);
  } catch (err) {
    logError('Controller:register - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const login = async (req, res) => {
  try {
    logInfo('Controller:login - Request received', { email: req.body.email });
    const { email, password } = req.body;
    if (!email || !password) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_EMAIL_PASSWORD_REQUIRED });
    const result = await authenticateUser({ email, password });
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:login - Success', { userId: result.user._id });
    sendTokens(res, result.user);
  } catch (err) {
    logError('Controller:login - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const refresh = async (req, res) => {
  try {
    logInfo('Controller:refresh - Request received');
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      logWarn('Controller:refresh - No refresh token');
      return res.status(HTTP_UNAUTHORIZED).json({ message: MSG_NO_REFRESH_TOKEN });
    }
    const result = await refreshUserToken(token);
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:refresh - Success', { userId: result.user._id });
    sendTokens(res, result.user);
  } catch {
    logWarn('Controller:refresh - Invalid or expired refresh token');
    res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTS).status(HTTP_UNAUTHORIZED).json({ message: MSG_INVALID_REFRESH_TOKEN });
  }
};

export const logout = (_req, res) => {
  logInfo('Controller:logout - User logged out');
  res.clearCookie(REFRESH_COOKIE_NAME, CLEAR_COOKIE_OPTS).json({ message: MSG_LOGGED_OUT });
};

export const me = async (req, res) => {
  logInfo('Controller:me - Request received', { userId: req.user._id });
  res.json({ user: req.user });
};
