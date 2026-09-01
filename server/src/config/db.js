import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Persistent data directory for the fallback in-memory MongoDB server. */
const MONGO_DATA_DIR = path.resolve(__dirname, '../../../.mongo-data');

export async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB isn't available
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    // If local MongoDB is not running, try the in-memory server for development
    if (env.nodeEnv === 'development') {
      console.warn(`Could not connect to ${env.mongoUri}: ${err.message}`);
      console.warn('Starting local MongoDB with persistent storage...');

      try {
        // Ensure the persistent data directory exists
        if (!fs.existsSync(MONGO_DATA_DIR)) {
          fs.mkdirSync(MONGO_DATA_DIR, { recursive: true });
        }

        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: {
            dbPath: MONGO_DATA_DIR,
            storageEngine: 'wiredTiger',
          },
        });
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`Local MongoDB started (persistent): ${conn.connection.host}/${conn.connection.name}`);
        console.log(`Data directory: ${MONGO_DATA_DIR}`);
        console.log('✅ Data will persist between server restarts.');
        return conn;
      } catch (memErr) {
        console.error('Failed to start local MongoDB:', memErr.message);
        throw err; // Throw the original error
      }
    }
    throw err;
  }
}
