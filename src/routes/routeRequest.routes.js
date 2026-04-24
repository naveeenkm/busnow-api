import { Router } from 'express';
import { submitRequest, listRequests, updateRequestStatus } from '../controllers/routeRequest.controller.js';
import { auth, adminOnly, validateObjectId } from '../middleware/auth.js';

const r = Router();
r.post('/', auth(false), submitRequest);
r.get('/', auth(true), adminOnly, listRequests);
r.patch('/:id', auth(true), adminOnly, validateObjectId(), updateRequestStatus);
export default r;
