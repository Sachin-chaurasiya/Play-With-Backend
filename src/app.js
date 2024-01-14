import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// handle cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// handle json
app.use(
  express.json({
    limit: "16kb",
  })
);

// handle url params
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// handle static files
app.use(express.static("public"));

// handle cookies
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import { API_ROUTE_PREFIX } from "./constants.js";

// routes declaration
app.use(`${API_ROUTE_PREFIX}/users`, userRouter);

export { app };
