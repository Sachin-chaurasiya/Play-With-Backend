import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { EMAIL_REGEX, RESPONSE_STATUS_CODE } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.log("error", `Token generation failed: ${error}`);
    throw new ApiError(
      RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Token generation failed"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from the client request
  // validation - not empty, valid email, etc.
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload images to cloudinary, avatar
  // create user object - create user in the database
  // remove password and refresh token from user object
  // check for user creation
  // return response to the client

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "username, email, full name and password required",
        ])
      );
  }

  // validate email
  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Invalid email address",
        ])
      );
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    logger.log("error", "User already exists");
    return res
      .status(RESPONSE_STATUS_CODE.CONFLICT)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.CONFLICT, ["User already exists"])
      );
  }

  if (!avatarLocalPath) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Avatar image is required",
        ])
      );
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Avatar upload failed",
        ])
      );
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // remove password and refresh token from user object
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    logger.log("error", "User creation failed");
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "User creation failed",
        ])
      );
  }
  return res
    .status(RESPONSE_STATUS_CODE.CREATED)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.CREATED,
        createdUser,
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get user details from the client request
  // validate user details - username or email, password
  // check if user exists
  // compare password
  // generate access token
  // generate refresh token
  // save refresh token in the database
  // send cookies to the client
  // return response to the client

  const { username, email, password } = req.body;

  if (!username && !email) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "username or email required",
        ])
      );
  }

  const user = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (!user) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["User not found"]));
  }

  const isPasswordMatched = await user.isPasswordCorrect(password);

  if (!isPasswordMatched) {
    return res
      .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid password"])
      );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // remove password and refresh token from user object
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        { accessToken, user: loggedInUser, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // get the logged in user
  // remove the refresh token from the database
  // clear the cookies
  // return response to the client

  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(RESPONSE_STATUS_CODE.SUCCESS, null, "Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.headers?.["Authorization"]?.replace("Bearer ", "") ||
    req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
      .json(new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid token"]));
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res
        .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
        .json(
          new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid token"])
        );
    }

    if (user.refreshToken !== incomingRefreshToken) {
      return res
        .status(RESPONSE_STATUS_CODE.UNAUTHORIZED)
        .json(
          new ApiError(RESPONSE_STATUS_CODE.UNAUTHORIZED, ["Invalid token"])
        );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(RESPONSE_STATUS_CODE.SUCCESS)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          RESPONSE_STATUS_CODE.SUCCESS,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Something went wrong",
        ])
      );
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
