import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let isConnected = false;
let isUsingInMemoryStore = false;

export const connectDatabase = async (): Promise<boolean> => {
  try {
    mongoose.set('strictQuery', true);
    
    // Attempt Mongoose connection with a short timeout
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    
    isConnected = true;
    isUsingInMemoryStore = false;
    logger.info(`MongoDB connected successfully to host: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error: any) {
    logger.warn(`Could not connect to external MongoDB at ${env.MONGODB_URI} (${error.message}).`);
    logger.info('Falling back to high-performance in-memory repository for zero-dependency execution.');
    isConnected = false;
    isUsingInMemoryStore = true;
    return false;
  }
};

export const getDbStatus = () => ({
  connected: isConnected,
  isInMemory: isUsingInMemoryStore,
  uri: env.MONGODB_URI
});

