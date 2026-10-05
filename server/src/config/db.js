import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache the connection across Vercel serverless invocations
// This prevents new connections from being created on every request
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        // Reuse existing connection
        return cached.conn;
    }

    if (!cached.promise) {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
            console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
    }

    return cached.conn;
};

export default connectDB;
