import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "MOGO_URI";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
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

// User schema storing Clerk credentials, profile info, and resume settings
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  clerkId: { type: String, sparse: true, unique: true },
  googleId: { type: String, sparse: true },
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
