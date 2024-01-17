import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../logger.js";

let connectionRetryCount = 0;

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
export const connectToDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_CONNECTION_URL}/${DB_NAME}`
    );
    logger.log(
      "info",
      `Connected to MongoDB database: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // Retry connection
    if (connectionRetryCount < 5) {
      connectionRetryCount++;
      logger.log(
        "warn",
        `Retrying connection to MongoDB database: ${connectionRetryCount}`
      );
      await connectToDatabase();
    } else {
      logger.log("error", `Error connecting to MongoDB: ${error.message}`);
      // Exit process with failure
      process.exit(1);
    }
  }
};
