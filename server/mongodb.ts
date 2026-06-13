import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  if (!MONGO_URI) {
    console.warn("MongoDB setup warning: MONGODB_URI environment variable is not defined.");
    return;
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    const db = await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
    isConnected = db.connection.readyState === 1;
    console.log("MongoDB Atlas connected successfully.");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
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
