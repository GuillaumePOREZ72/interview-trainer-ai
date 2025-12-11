import mongoose from "mongoose";
import { logger } from "../config/logger";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {});
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
