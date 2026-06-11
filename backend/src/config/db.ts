import mongoose from "mongoose";

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing in .env file");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    retryCount = 0;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      const delay = Math.min(retryCount * 3000, 15000);
      console.error(`❌ MongoDB connection error (attempt ${retryCount}/${MAX_RETRIES}), retrying in ${delay}ms:`, (error as Error).message);
      setTimeout(() => connectDB(), delay);
    } else {
      console.error("❌ MongoDB failed after max retries. Server running without DB.");
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting reconnection...");
  retryCount = 0;
  setTimeout(() => connectDB(), 3000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
});

export default connectDB;
