import { getAllUsers, deleteUserById } from '../services/adminUser.service.js';
import { logInfo, logError } from '../config/logger.js';
import { HTTP_SERVER_ERROR, MSG_SERVER_ERROR } from '../constants/index.js';

export const listUsers = async (_req, res) => {
  try {
    logInfo('Controller:listUsers - Request received');
    const users = await getAllUsers();
    logInfo('Controller:listUsers - Success', { count: users.length });
    res.json({ users });
  } catch (err) {
    logError('Controller:listUsers - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};

export const deleteUser = async (req, res) => {
  try {
    logInfo('Controller:deleteUser - Request received', { targetId: req.params.id });
    const result = await deleteUserById(req.user._id.toString(), req.params.id);
    if (result.error) return res.status(result.status).json({ message: result.error });
    logInfo('Controller:deleteUser - Success', { targetId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    logError('Controller:deleteUser - Failed', { error: err.message, stack: err.stack });
    res.status(HTTP_SERVER_ERROR).json({ message: MSG_SERVER_ERROR });
  }
};
