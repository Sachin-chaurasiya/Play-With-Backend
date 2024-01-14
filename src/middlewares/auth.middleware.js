import { RESPONSE_STATUS_CODE } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.headers?.["Authorization"]?.replace("Bearer ", "");

  if (!accessToken) {
    return res
      .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, [
          "Unauthorized request",
        ])
      );
  }

  try {
    // verify the access token
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const currentUser = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!currentUser) {
      throw new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid token"]);
    }
    // set the user on the request object
    req.user = currentUser;
    next();
  } catch (error) {
    return res
      .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
      .json(new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid token"]));
  }
});
