import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.post('/refresh', refresh);
r.post('/logout', logout);
r.get('/me', auth(true), me);
export default r;
