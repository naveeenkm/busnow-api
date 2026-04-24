import RouteRequest from '../models/RouteRequest.js';
import { logInfo, logWarn } from '../config/logger.js';
import { createBusEntry } from './bus.service.js';
import { REQUEST_STATUS_APPROVED, REQUEST_STATUS_REJECTED, DEFAULT_FREQUENCY } from '../constants/index.js';

export const createRouteRequest = async ({ fromCity, toCity, name, notes, contactEmail, arrivalTime, requestedBy }) => {
  logInfo('Service:createRouteRequest - Processing request', { fromCity, toCity });
  const rr = await RouteRequest.create({
    fromCity: fromCity.trim(),
    toCity: toCity.trim(),
    name: (name || '').trim(),
    notes: (notes || '').trim(),
    contactEmail: (contactEmail || '').trim(),
    arrivalTime: (arrivalTime || '').trim(),
    requestedBy: requestedBy || null,
  });
  logInfo('Service:createRouteRequest - Success', { requestId: rr._id });
  return rr;
};

export const getAllRouteRequests = async () => {
  logInfo('Service:getAllRouteRequests - Processing request');
  const requests = await RouteRequest.find().sort({ createdAt: -1 }).populate('requestedBy', 'name email');
  logInfo('Service:getAllRouteRequests - Success', { count: requests.length });
  return requests;
};

export const updateRouteRequestStatus = async (id, { status, rejectionReason }) => {
  logInfo('Service:updateRouteRequestStatus - Processing request', { requestId: id, status });
  const update = { status, rejectionReason: status === REQUEST_STATUS_REJECTED ? (rejectionReason || '').trim() : '' };
  const rr = await RouteRequest.findByIdAndUpdate(id, update, { new: true });
  if (!rr) {
    logWarn('Service:updateRouteRequestStatus - Request not found', { requestId: id });
    return null;
  }
  if (status === REQUEST_STATUS_APPROVED) {
    logInfo('Service:updateRouteRequestStatus - Auto-creating bus', { fromCity: rr.fromCity, toCity: rr.toCity });
    await createBusEntry({
      name: rr.name || `${rr.fromCity} - ${rr.toCity}`,
      fromCity: rr.fromCity, toCity: rr.toCity,
      arrivalTime: rr.arrivalTime || '', frequency: DEFAULT_FREQUENCY,
    });
  }
  logInfo('Service:updateRouteRequestStatus - Success', { requestId: id, status });
  return rr;
};

export const getRouteRequestsByUser = async (userId) => {
  logInfo('Service:getRouteRequestsByUser - Processing request', { userId });
  const requests = await RouteRequest.find({ requestedBy: userId }).sort({ createdAt: -1 });
  logInfo('Service:getRouteRequestsByUser - Success', { count: requests.length });
  return requests;
};
