import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { logInfo, logWarn, logDebug } from '../config/logger.js';
import { BCRYPT_SALT_ROUNDS, ROLE_ADMIN } from '../constants/index.js';

export const seedAdminAndDemo = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
      await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hash, role: ROLE_ADMIN });
      logInfo('Service:seed - Seeded admin', { email: ADMIN_EMAIL });
    } else if (existing.role !== ROLE_ADMIN) {
      existing.role = ROLE_ADMIN;
      await existing.save();
      logInfo('Service:seed - Promoted to admin', { email: ADMIN_EMAIL });
    } else {
      logDebug('Service:seed - Admin already exists', { email: ADMIN_EMAIL });
    }
  } else {
    logWarn('Service:seed - ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping seed');
  }
};
