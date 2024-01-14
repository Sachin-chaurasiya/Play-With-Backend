import { app } from "./app.js";
import { connectToDatabase } from "./db/index.js";

import dotenv from "dotenv";
import logger from "./logger.js";

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

connectToDatabase()
  .then(() => {
    app.on("error", (error) => {
      throw new Error(`Unable to run the server: ${error}`);
    });

    app.listen(process.env.PORT || 8000, () => {
      logger.log("info", `Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) =>
    logger.log("error", `Error connecting to MongoDB: ${error}`)
  );
