import bcrypt from 'bcryptjs';
import RideHistory from '../models/RideHistory.js';
import Bus from '../models/Bus.js';
import User from '../models/User.js';
import { logInfo, logWarn } from '../config/logger.js';
import {
  BCRYPT_SALT_ROUNDS, MIN_PASSWORD_LENGTH,
  HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_NOT_FOUND,
  MSG_BUS_NOT_FOUND, MSG_CURRENT_PASSWORD_REQUIRED, MSG_CURRENT_PASSWORD_INCORRECT, MSG_PASSWORD_TOO_SHORT,
} from '../constants/index.js';

export const getRideHistory = async (userId) => {
  logInfo('Service:getRideHistory - Processing request', { userId });
  const history = await RideHistory.find({ user: userId }).sort({ createdAt: -1 }).populate('bus');
  logInfo('Service:getRideHistory - Success', { userId, count: history.length });
  return history;
};

export const addRideHistory = async (userId, busId) => {
  logInfo('Service:addRideHistory - Processing request', { userId, busId });
  const bus = await Bus.findById(busId);
  if (!bus) {
    logWarn('Service:addRideHistory - Bus not found', { busId });
    return { error: MSG_BUS_NOT_FOUND, status: HTTP_NOT_FOUND };
  }
  const entry = await RideHistory.create({ user: userId, bus: bus._id, fromCity: bus.fromCity, toCity: bus.toCity });
  logInfo('Service:addRideHistory - Success', { userId, busId });
  return { entry };
};

export const getUserFavorites = async (user) => {
  logInfo('Service:getUserFavorites - Processing request', { userId: user._id });
  return user.favorites;
};

export const addUserFavorite = async (userId, { from, to }) => {
  logInfo('Service:addUserFavorite - Processing request', { userId, from, to });
  const user = await User.findById(userId);
  user.favorites.push({ from: from.trim(), to: to.trim() });
  await user.save();
  logInfo('Service:addUserFavorite - Success', { userId });
  return user.favorites;
};

export const removeUserFavorite = async (userId, favoriteId) => {
  logInfo('Service:removeUserFavorite - Processing request', { userId, favoriteId });
  const user = await User.findById(userId);
  user.favorites.id(favoriteId)?.deleteOne();
  await user.save();
  logInfo('Service:removeUserFavorite - Success', { userId, favoriteId });
  return user.favorites;
};

export const updateUserProfile = async (userId, { name, currentPassword, newPassword }) => {
  logInfo('Service:updateUserProfile - Processing request', { userId });
  const user = await User.findById(userId).select('+password');
  if (name) user.name = name.trim();
  if (newPassword) {
    if (!currentPassword) {
      logWarn('Service:updateUserProfile - Current password required', { userId });
      return { error: MSG_CURRENT_PASSWORD_REQUIRED, status: HTTP_BAD_REQUEST };
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      logWarn('Service:updateUserProfile - Current password incorrect', { userId });
      return { error: MSG_CURRENT_PASSWORD_INCORRECT, status: HTTP_UNAUTHORIZED };
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      logWarn('Service:updateUserProfile - Password too short', { userId });
      return { error: MSG_PASSWORD_TOO_SHORT, status: HTTP_BAD_REQUEST };
    }
    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  }
  await user.save();
  logInfo('Service:updateUserProfile - Success', { userId });
  return { user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

export const deleteUserAccount = async (userId) => {
  logInfo('Service:deleteUserAccount - Processing request', { userId });
  await User.findByIdAndDelete(userId);
  logInfo('Service:deleteUserAccount - Success', { userId });
};
