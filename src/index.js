import { connectToDatabase } from "./db/index.js";

import dotenv from "dotenv";

// Load env variables
dotenv.config({
  path: "./.env",
});

// IIFE Approch for connecting to database
/** 
(async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_CONNECTION_URL}/${DB_NAME}`);
    console.log("Database connected");
  } catch (error) {
    console.log("Error connecting to database", error);
  }
})();
*/

connectToDatabase();
