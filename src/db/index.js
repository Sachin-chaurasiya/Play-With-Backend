import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectToDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_CONNECTION_URL}/${DB_NAME}`
    );
    console.log("MongoDB connected", connectionInstance.connection.host);
  } catch (error) {
    console.log("Error connecting to MongoDB database", error);
    // Exit process with failure
    process.exit(1);
  }
};
