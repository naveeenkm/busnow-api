import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { seedAdminAndDemo } from './services/seed.service.js';
import { errorHandler, notFound } from './middleware/error.js';
import logger from './config/logger.js';

import authRoutes from './routes/auth.routes.js';
import busRoutes from './routes/bus.routes.js';
import routeRequestRoutes from './routes/routeRequest.routes.js';
import userRoutes from './routes/user.routes.js';
import adminUserRoutes from './routes/adminUser.routes.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const SENSITIVE = ['password', 'accessToken', 'refreshToken', 'token', 'hash'];
const maskBody = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE.includes(k) ? [k, '***'] : [k, typeof v === 'object' ? maskBody(v) : v]
    )
  );
};

app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const ms = Date.now() - start;
    const preview = JSON.stringify(maskBody(body));
    const snippet = preview.length > 80 ? preview.slice(0, 80) + '…}' : preview;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms — ${snippet}`);
    return originalJson(body);
  };
  next();
});

app.get('/', (_req, res) => res.json({ ok: true, service: 'busnow-api' }));

app.get('/api/health-check', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const db = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  const status = dbState === 1 ? 'healthy' : 'unhealthy';
  res.status(dbState === 1 ? 200 : 503).json({
    status,
    db,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/route-requests', routeRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.use(notFound);
app.use(errorHandler);

// Connect DB once (safe to call multiple times in serverless)
let isConnected = false;
export const initDB = async () => {
  if (isConnected) return;
  await connectDB(process.env.MONGO_URI);
  await seedAdminAndDemo();
  isConnected = true;
};

export default app;
