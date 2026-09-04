import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If no URI or local memory mode requested, spin up MongoMemoryServer for effortless zero-config testing
    if (!mongoUri || mongoUri.startsWith('memory:')) {
      console.log('ℹ️  No remote MONGO_URI found in environment. Initializing in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log(`✅ In-memory MongoDB running at: ${mongoUri}`);
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
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
    console.error(`Error disconnecting DB: ${error.message}`);
  }
};
