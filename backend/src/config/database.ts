/**
 * MongoDB Database Connection
 * Production-ready database configuration with connection pooling
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'frontbench-dev';

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not set in environment variables');
  process.exit(1);
}

// TypeScript assertion: MONGODB_URI is guaranteed to be defined after the check above
const MONGODB_URI_FINAL: string = MONGODB_URI;

// Connection options for production
const connectionOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

let isConnected = false;

// Disable Mongoose buffering globally
mongoose.set('bufferCommands', false);

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('📦 MongoDB already connected');
    return;
  }

  try {
    // Construct full connection string with database name
    // Handle both cases: URI with and without trailing slash
    let fullUri: string;
    if (MONGODB_URI_FINAL.includes('mongodb.net/')) {
      // Already has database path, replace it
      const baseUri = MONGODB_URI_FINAL.split('/').slice(0, -1).join('/');
      fullUri = `${baseUri}/${DATABASE_NAME}?retryWrites=true&w=majority`;
    } else if (MONGODB_URI_FINAL.endsWith('/')) {
      fullUri = `${MONGODB_URI_FINAL}${DATABASE_NAME}?retryWrites=true&w=majority`;
    } else {
      fullUri = `${MONGODB_URI_FINAL}/${DATABASE_NAME}?retryWrites=true&w=majority`;
    }

    await mongoose.connect(fullUri, connectionOptions);
    
    isConnected = true;
    console.log(`✅ MongoDB connected to database: ${DATABASE_NAME}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    isConnected = false;
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('📦 MongoDB disconnected');
  } catch (error: any) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
