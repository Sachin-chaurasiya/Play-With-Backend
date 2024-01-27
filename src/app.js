import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { API_ROUTE_PREFIX } from "./constants.js";
import { rateLimiter } from "./middlewares/ratelimit.middleware.js";

const app = express();

// handle cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
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

// rate limiter
app.use(rateLimiter);

// routes import
import userRouter from "./routes/user.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// routes declaration
app.use(`${API_ROUTE_PREFIX}/users`, userRouter);
app.use(`${API_ROUTE_PREFIX}/health-check`, healthCheckRouter);
app.use(`${API_ROUTE_PREFIX}/tweets`, tweetRouter);
app.use(`${API_ROUTE_PREFIX}/subscriptions`, subscriptionRouter);
app.use(`${API_ROUTE_PREFIX}/videos`, videoRouter);
app.use(`${API_ROUTE_PREFIX}/comments`, commentRouter);
app.use(`${API_ROUTE_PREFIX}/likes`, likeRouter);
app.use(`${API_ROUTE_PREFIX}/playlist`, playlistRouter);
app.use(`${API_ROUTE_PREFIX}/dashboard`, dashboardRouter);

export { app };
