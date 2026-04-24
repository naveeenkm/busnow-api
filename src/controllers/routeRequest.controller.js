import { createRouteRequest, getAllRouteRequests, updateRouteRequestStatus } from '../services/routeRequest.service.js';
import { logInfo, logError } from '../config/logger.js';
import {
  HTTP_CREATED, HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_SERVER_ERROR,
  VALID_REQUEST_STATUSES,
  MSG_CITIES_REQUIRED, MSG_INVALID_STATUS, MSG_REQUEST_NOT_FOUND, MSG_SERVER_ERROR,
} from '../constants/index.js';

export const submitRequest = async (req, res) => {
  try {
    const { fromCity, toCity, name, notes, contactEmail, arrivalTime } = req.body;
    logInfo('Controller:submitRequest - Request received', { fromCity, toCity });
    if (!fromCity || !toCity) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_CITIES_REQUIRED });
    const rr = await createRouteRequest({
      fromCity, toCity, name, notes,
      contactEmail: contactEmail || req.user?.email || '',
      arrivalTime,
      requestedBy: req.user?._id,
    });
    logInfo('Controller:submitRequest - Success', { requestId: rr._id });
    res.status(HTTP_CREATED).json({ request: rr });
  } catch (err) {
    logError('Controller:submitRequest - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const listRequests = async (_req, res) => {
  try {
    logInfo('Controller:listRequests - Request received');
    const requests = await getAllRouteRequests();
    logInfo('Controller:listRequests - Success', { count: requests.length });
    res.json({ requests });
  } catch (err) {
    logError('Controller:listRequests - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    logInfo('Controller:updateRequestStatus - Request received', { requestId: req.params.id, status });
    if (!VALID_REQUEST_STATUSES.includes(status)) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_INVALID_STATUS });
    const rr = await updateRouteRequestStatus(req.params.id, { status, rejectionReason });
    if (!rr) return res.status(HTTP_NOT_FOUND).json({ message: MSG_REQUEST_NOT_FOUND });
    logInfo('Controller:updateRequestStatus - Success', { requestId: req.params.id, status });
    res.json({ request: rr });
  } catch (err) {
    logError('Controller:updateRequestStatus - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};
