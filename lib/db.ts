import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Reuse the connection across hot-reloads in dev and across invocations in serverless.
// Without this, each serverless function call would open a new connection and exhaust the pool.
let cached = (global as any).mongoose ?? { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // maxPoolSize: 1 is intentional — serverless functions are single-threaded and a larger
    // pool would hold connections open without benefit while counting against Atlas limits.
    cached.promise = mongoose.connect(MONGODB_URI, { maxPoolSize: 1 }).then(m => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Clear the failed promise so the next call retries the connection.
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
