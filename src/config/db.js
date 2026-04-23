import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async (uri) => {
  if (!uri) throw new Error('MONGO_URI is missing in .env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
};
