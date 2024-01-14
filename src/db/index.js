import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../logger.js";

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
    logger.log("error", `Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};
