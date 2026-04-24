import { findBuses, createBusEntry, updateBusEntry, deleteBusEntry, findNearbyBuses, getPopularRoutes, getDistinctCities } from '../services/bus.service.js';
import { logInfo, logError } from '../config/logger.js';
import {
  HTTP_CREATED, HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_SERVER_ERROR,
  MSG_BUS_FIELDS_REQUIRED, MSG_BUS_NOT_FOUND, MSG_FROM_TO_REQUIRED, MSG_SERVER_ERROR,
} from '../constants/index.js';

export const listBuses = async (req, res) => {
  try {
    const from = req.body?.from || req.query?.from;
    const to   = req.body?.to   || req.query?.to;
    logInfo('Controller:listBuses - Request received', { from, to });
    const buses = await findBuses({ from, to });
    logInfo('Controller:listBuses - Success', { count: buses.length });
    res.json({ buses });
  } catch (err) {
    logError('Controller:listBuses - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const createBus = async (req, res) => {
  try {
    const { name, fromCity, toCity, arrivalTime, frequency } = req.body;
    logInfo('Controller:createBus - Request received', { fromCity, toCity });
    if (!fromCity || !toCity || !arrivalTime)
      return res.status(HTTP_BAD_REQUEST).json({ message: MSG_BUS_FIELDS_REQUIRED });
    const bus = await createBusEntry({ name, fromCity, toCity, arrivalTime, frequency, createdBy: req.user._id });
    logInfo('Controller:createBus - Success', { busId: bus._id });
    res.status(HTTP_CREATED).json({ bus });
  } catch (err) {
    logError('Controller:createBus - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const updateBus = async (req, res) => {
  try {
    logInfo('Controller:updateBus - Request received', { busId: req.params.id });
    const bus = await updateBusEntry(req.params.id, { ...req.body });
    if (!bus) return res.status(HTTP_NOT_FOUND).json({ message: MSG_BUS_NOT_FOUND });
    logInfo('Controller:updateBus - Success', { busId: req.params.id });
    res.json({ bus });
  } catch (err) {
    logError('Controller:updateBus - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const deleteBus = async (req, res) => {
  try {
    logInfo('Controller:deleteBus - Request received', { busId: req.params.id });
    const bus = await deleteBusEntry(req.params.id);
    if (!bus) return res.status(HTTP_NOT_FOUND).json({ message: MSG_BUS_NOT_FOUND });
    logInfo('Controller:deleteBus - Success', { busId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    logError('Controller:deleteBus - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const nearbyBuses = async (req, res) => {
  try {
    const from = (req.body?.from || '').trim();
    const to   = (req.body?.to || '').trim();
    logInfo('Controller:nearbyBuses - Request received', { from, to });
    if (!from || !to) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_FROM_TO_REQUIRED });
    const suggestions = await findNearbyBuses({ from, to });
    logInfo('Controller:nearbyBuses - Success', { count: suggestions.length });
    res.json({ suggestions });
  } catch (err) {
    logError('Controller:nearbyBuses - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const popularRoutes = async (_req, res) => {
  try {
    logInfo('Controller:popularRoutes - Request received');
    const routes = await getPopularRoutes();
    logInfo('Controller:popularRoutes - Success', { count: routes.length });
    res.json({ routes });
  } catch (err) {
    logError('Controller:popularRoutes - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const cities = async (_req, res) => {
  try {
    logInfo('Controller:cities - Request received');
    const cityList = await getDistinctCities();
    logInfo('Controller:cities - Success', { count: cityList.length });
    res.json({ cities: cityList });
  } catch (err) {
    logError('Controller:cities - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};
