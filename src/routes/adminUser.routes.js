import { Router } from 'express';
import { listUsers, deleteUser } from '../controllers/adminUser.controller.js';
import { auth, adminOnly } from '../middleware/auth.js';

const r = Router();
r.use(auth(true), adminOnly);
r.get('/', listUsers);
r.delete('/:id', deleteUser);
export default r;
