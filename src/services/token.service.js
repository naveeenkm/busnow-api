import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH } from '../constants/index.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, type: TOKEN_TYPE_ACCESS },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), type: TOKEN_TYPE_REFRESH },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
