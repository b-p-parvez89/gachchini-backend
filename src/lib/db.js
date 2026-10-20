import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment');
let cache = global.mongooseCache;
if (!cache) cache = global.mongooseCache = { conn: null, promise: null };
export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 10000 }).then(m => m);
  try { cache.conn = await cache.promise; } catch (e) { cache.promise = null; throw e; }
  return cache.conn;
}
