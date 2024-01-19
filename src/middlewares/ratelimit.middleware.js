import { RateLimiterMemory } from "rate-limiter-flexible";
import { RESPONSE_STATUS_CODE } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";

export const rateLimit = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 10, // per 1 second
  blockDuration: 60, // 1 minute
});

export const rateLimiter = async (req, res, next) => {
  try {
    await rateLimit.consume(req.ip);
    next();
  } catch (error) {
    res
      .status(RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS, [
          "Please do not DDOS our server!",
        ])
      );
  }
};
