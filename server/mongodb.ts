import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

let isConnected = false;
let connectionPromise: Promise<any> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
      return;
    } catch (err) {
      connectionPromise = null;
      throw err;
    }
  }

  if (!MONGO_URI) {
    throw new Error("MONGODB_URI environment variable is not defined. Please configure it in your Settings > Secrets.");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    // Configured with fast timeout to avoid serverless function execution timeouts in Vercel
    connectionPromise = mongoose.connect(MONGO_URI, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    const db = await connectionPromise;
    isConnected = db.connection.readyState === 1;
    console.log("MongoDB Atlas connected successfully.");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    connectionPromise = null; // Clear promise on error so that retries are possible
    isConnected = false;
    throw error;
  }
}

// User schema storing credentials, profile info, and resume settings
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  clerkId: { type: String, sparse: true, unique: true },
  googleId: { type: String, sparse: true },
  passwordHash: { type: String },
  salt: { type: String },
  name: { type: String },
  picture: { type: String },
  resumeData: { type: Object, default: null },
  settings: { type: Object, default: null },
  sessionToken: { type: String, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Avoid any type strictness compiler warnings with Mongoose Models in tsx server
export const User = (mongoose.models.User || mongoose.model("User", userSchema)) as any;
