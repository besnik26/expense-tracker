const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  const forceMemoryDB = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test';
  let mongoUri = process.env.MONGODB_URI || '';

  if (forceMemoryDB) {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    mongoUri = memoryServer.getUri();
    process.env.MONGODB_URI = mongoUri;
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined. Add your MongoDB Atlas connection string to the .env file.');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

const stopMemoryDB = async () => {
  if (memoryServer) {
    await mongoose.disconnect();
    await memoryServer.stop();
    memoryServer = null;
  }
  if (process.env.MONGODB_URI && process.env.USE_MEMORY_DB === 'true') {
    delete process.env.MONGODB_URI;
  }
};

module.exports = { connectDB, stopMemoryDB };
