import { Router } from 'express';
import { listBuses, createBus, updateBus, deleteBus, popularRoutes, cities, nearbyBuses } from '../controllers/bus.controller.js';
import { auth, adminOnly, validateObjectId } from '../middleware/auth.js';

const r = Router();
r.get('/', auth(true), adminOnly, listBuses);
r.post('/search', listBuses);
r.post('/nearby', nearbyBuses);
r.get('/popular', popularRoutes);
r.get('/cities', cities);
r.post('/', auth(true), adminOnly, createBus);
r.put('/:id', auth(true), adminOnly, validateObjectId(), updateBus);
r.delete('/:id', auth(true), adminOnly, validateObjectId(), deleteBus);
export default r;
