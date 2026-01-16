const mongoose = require("mongoose");

let isConnecting = false;

// Keep serverless invocations snappy:
// - Bound connection attempts (so the function doesn't sit until Vercel times out)
// - Reuse existing connections across warm invocations
const DEFAULT_TIMEOUT_MS = Number(
  process.env.MONGODB_CONNECT_TIMEOUT_MS || 4000
);

async function connectDB() {
  if (
    mongoose.connection.readyState === 1 ||
    mongoose.connection.readyState === 2
  ) {
    return;
  }
  if (isConnecting) return;
  isConnecting = true;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }

    // Add timeout to prevent hanging on slow database connections
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), DEFAULT_TIMEOUT_MS)
    })

    const connectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: DEFAULT_TIMEOUT_MS,
      socketTimeoutMS: DEFAULT_TIMEOUT_MS,
      connectTimeoutMS: DEFAULT_TIMEOUT_MS,
    })

    await Promise.race([connectPromise, timeout])
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  } finally {
    isConnecting = false;
  }
}

module.exports = { connectDB };
