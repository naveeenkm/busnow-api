import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken } from '../services/token.service.js';

const isCrossSite = process.env.CORS_ORIGIN && process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: isCrossSite ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const sendTokens = (res, user, status = 200) =>
  res
    .status(status)
    .cookie('refreshToken', signRefreshToken(user), REFRESH_COOKIE_OPTS)
    .json({ accessToken: signAccessToken(user), user });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be 6+ chars' });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  sendTokens(res, user, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  sendTokens(res, user);
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') throw new Error();
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    sendTokens(res, user);
  } catch {
    res.clearCookie('refreshToken').status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = (_req, res) => {
  res.clearCookie('refreshToken', { path: '/' }).json({ message: 'Logged out' });
};

export const me = async (req, res) => res.json({ user: req.user });
