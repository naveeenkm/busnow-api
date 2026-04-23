import jwt from 'jsonwebtoken';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
