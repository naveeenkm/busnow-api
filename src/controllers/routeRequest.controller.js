import RouteRequest from '../models/RouteRequest.js';
import Bus from '../models/Bus.js';
import { geocodeCity } from './bus.controller.js';

export const submitRequest = async (req, res) => {
  const { fromCity, toCity, name, notes, contactEmail, arrivalTime } = req.body;
  if (!fromCity || !toCity) return res.status(400).json({ message: 'fromCity and toCity required' });
  const rr = await RouteRequest.create({
    fromCity: fromCity.trim(),
    toCity: toCity.trim(),
    name: (name || '').trim(),
    notes: (notes || '').trim(),
    contactEmail: (contactEmail || req.user?.email || '').trim(),
    arrivalTime: (arrivalTime || '').trim(),
    requestedBy: req.user?._id || null,
  });
  res.status(201).json({ request: rr });
};

export const listRequests = async (_req, res) => {
  const requests = await RouteRequest.find().sort({ createdAt: -1 }).populate('requestedBy', 'name email');
  res.json({ requests });
};

export const updateRequestStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const update = { status, rejectionReason: status === 'rejected' ? (rejectionReason || '').trim() : '' };
  const rr = await RouteRequest.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!rr) return res.status(404).json({ message: 'Request not found' });
  if (status === 'approved') {
    const [fromCoords, toCoords] = await Promise.all([
      geocodeCity(rr.fromCity),
      geocodeCity(rr.toCity),
    ]);
    await Bus.create({
      name: rr.name || `${rr.fromCity} - ${rr.toCity}`,
      fromCity: rr.fromCity,
      toCity: rr.toCity,
      fromCoords,
      toCoords,
      arrivalTime: rr.arrivalTime || '',
      frequency: 'Every day',
      status: 'approved',
    });
  }
  res.json({ request: rr });
};
