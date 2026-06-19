import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in environment variables');

    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));

export default connectDB;
