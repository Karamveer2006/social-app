import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let memoryServer = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If no URI or local memory mode requested, spin up MongoMemoryServer for development/testing
    if (!mongoUri || mongoUri.startsWith('memory:')) {
      logger.info('Initializing in-memory MongoDB server');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      logger.info({ uri: mongoUri }, 'In-memory MongoDB initialized');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info({ host: conn.connection.host }, 'MongoDB connected');
    return conn;
  } catch (error) {
    logger.fatal({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting MongoDB');
  }
};
