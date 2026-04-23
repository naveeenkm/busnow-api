import { Router } from 'express';
import { getHistory, addHistory, getFavorites, addFavorite, removeFavorite, getMyRequests, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.use(auth(true));
r.get('/me/history', getHistory);
r.post('/me/history', addHistory);
r.get('/me/favorites', getFavorites);
r.post('/me/favorites', addFavorite);
r.delete('/me/favorites/:id', removeFavorite);
r.get('/me/requests', getMyRequests);
r.patch('/me', updateProfile);
r.delete('/me', deleteAccount);
export default r;
