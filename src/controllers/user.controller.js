import { getRideHistory, addRideHistory, getUserFavorites, addUserFavorite, removeUserFavorite, updateUserProfile, deleteUserAccount } from '../services/user.service.js';
import { getRouteRequestsByUser } from '../services/routeRequest.service.js';
import { logInfo, logError } from '../config/logger.js';
import {
  HTTP_CREATED, HTTP_BAD_REQUEST, HTTP_SERVER_ERROR,
  MSG_FROM_TO_REQUIRED, MSG_SERVER_ERROR,
} from '../constants/index.js';

export const getHistory = async (req, res) => {
  try {
    logInfo('Controller:getHistory - Request received', { userId: req.user._id });
    const history = await getRideHistory(req.user._id);
    logInfo('Controller:getHistory - Success', { count: history.length });
    res.json({ history });
  } catch (err) {
    logError('Controller:getHistory - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const addHistory = async (req, res) => {
  try {
    logInfo('Controller:addHistory - Request received', { userId: req.user._id, busId: req.body.busId });
    const result = await addRideHistory(req.user._id, req.body.busId);
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:addHistory - Success');
    res.status(HTTP_CREATED).json({ entry: result.entry });
  } catch (err) {
    logError('Controller:addHistory - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const getFavorites = async (req, res) => {
  try {
    logInfo('Controller:getFavorites - Request received', { userId: req.user._id });
    const favorites = await getUserFavorites(req.user);
    logInfo('Controller:getFavorites - Success', { count: favorites.length });
    res.json({ favorites });
  } catch (err) {
    logError('Controller:getFavorites - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { from, to } = req.body;
    logInfo('Controller:addFavorite - Request received', { userId: req.user._id, from, to });
    if (!from || !to) return res.status(HTTP_BAD_REQUEST).json({ message: MSG_FROM_TO_REQUIRED });
    const favorites = await addUserFavorite(req.user._id, { from, to });
    logInfo('Controller:addFavorite - Success');
    res.status(HTTP_CREATED).json({ favorites });
  } catch (err) {
    logError('Controller:addFavorite - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    logInfo('Controller:removeFavorite - Request received', { userId: req.user._id, favoriteId: req.params.id });
    const favorites = await removeUserFavorite(req.user._id, req.params.id);
    logInfo('Controller:removeFavorite - Success');
    res.json({ favorites });
  } catch (err) {
    logError('Controller:removeFavorite - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    logInfo('Controller:getMyRequests - Request received', { userId: req.user._id });
    const requests = await getRouteRequestsByUser(req.user._id);
    logInfo('Controller:getMyRequests - Success', { count: requests.length });
    res.json({ requests });
  } catch (err) {
    logError('Controller:getMyRequests - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const updateProfile = async (req, res) => {
  try {
    logInfo('Controller:updateProfile - Request received', { userId: req.user._id });
    const result = await updateUserProfile(req.user._id, req.body);
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:updateProfile - Success', { userId: req.user._id });
    res.json({ user: result.user });
  } catch (err) {
    logError('Controller:updateProfile - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    logInfo('Controller:deleteAccount - Request received', { userId: req.user._id });
    await deleteUserAccount(req.user._id);
    logInfo('Controller:deleteAccount - Success', { userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    logError('Controller:deleteAccount - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};
