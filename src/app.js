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

export { app };
