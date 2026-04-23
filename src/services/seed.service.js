import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const seedAdminAndDemo = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hash, role: 'admin' });
      logger.info(`Seeded admin: ${ADMIN_EMAIL}`);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      logger.info(`Promoted ${ADMIN_EMAIL} to admin`);
    } else {
      logger.debug(`Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed');
  }
};
