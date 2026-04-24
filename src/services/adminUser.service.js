import User from '../models/User.js';
import { logInfo, logWarn } from '../config/logger.js';
import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND, MSG_CANNOT_DELETE_SELF, MSG_USER_NOT_FOUND } from '../constants/index.js';

export const getAllUsers = async () => {
  logInfo('Service:getAllUsers - Processing request');
  const users = await User.find().sort({ createdAt: -1 });
  logInfo('Service:getAllUsers - Success', { count: users.length });
  return users;
};

export const deleteUserById = async (adminId, targetId) => {
  logInfo('Service:deleteUserById - Processing request', { adminId, targetId });
  if (adminId === targetId) {
    logWarn('Service:deleteUserById - Cannot delete self', { adminId });
    return { error: MSG_CANNOT_DELETE_SELF, status: HTTP_BAD_REQUEST };
  }
  const user = await User.findByIdAndDelete(targetId);
  if (!user) {
    logWarn('Service:deleteUserById - User not found', { targetId });
    return { error: MSG_USER_NOT_FOUND, status: HTTP_NOT_FOUND };
  }
  logInfo('Service:deleteUserById - Success', { targetId });
  return { ok: true };
};
