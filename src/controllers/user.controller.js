import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  getPublicIdFromUrl,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { EMAIL_REGEX, RESPONSE_STATUS_CODE } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 *
 * @param String userId
 * @returns { accessToken, refreshToken }
 */
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

/**
 * @description Register a new user
 * @route POST /api/users/register
 * @access Public
 * @returns { message, data, error }
 */
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

/**
 * @description Login a user
 * @route POST /api/users/login
 * @access Public
 * @returns { message, data, error }
 */
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

/**
 * @description Logout a user
 * @route POST /api/users/logout
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
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

/**
 * @description Refresh access token
 * @route POST /api/users/refresh-token
 * @access Public
 * @returns { message, data, error }
 */
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

/**
 * @description Change current password
 * @route POST /api/users/change-password
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get the logged in user
  // validate current password
  // validate new password
  // compare current password with new password
  // update the password
  // return response to the client

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "current password and new password required",
        ])
      );
  }

  // req.user is available because of the auth middleware
  const user = await User.findById(req.user?._id);

  const isPasswordMatched = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordMatched) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Password mismatch"])
      );
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(RESPONSE_STATUS_CODE.SUCCESS, null, "Password changed")
    );
});

/**
 * @description Get current user
 * @route GET /api/users/me
 * @access Private - only logged in user can access this route
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        req.user,
        "Current user fetched successfully"
      )
    );
});

/**
 * @description Update account details
 * @route PATCH /api/users/me
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "full name and email required",
        ])
      );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        user,
        "Account details updated"
      )
    );
});

/**
 * @description Update user avatar
 * @route PATCH /api/users/me/avatar
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  // here we will be having single file
  const avatarLocalPath = req.file?.path;

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

  if (!avatar?.url) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Avatar upload failed",
        ])
      );
  }

  // delete the previous avatar from cloudinary
  // get the public id from the url
  // delete the image from cloudinary
  const publicId = getPublicIdFromUrl(req.user?.avatar);
  await deleteFromCloudinary(publicId);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        user,
        "Avatar updated successfully"
      )
    );
});

/**
 * @description Update user cover image
 * @route PATCH /api/users/me/cover-image
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Cover image is required",
        ])
      );
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Cover image upload failed",
        ])
      );
  }

  // delete the previous coverImage from cloudinary
  // get the public id from the url
  // delete the image from cloudinary
  const publicId = getPublicIdFromUrl(req.user?.coverImage);
  await deleteFromCloudinary(publicId);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        user,
        "Cover image updated successfully"
      )
    );
});

/**
 * @description Get user channel profile
 * @route GET /api/users/channel/:username
 * @access Public
 * @returns { message, data, error }
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Username required"])
      );
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Channel not found"])
      );
  }

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        channel[0],
        "Channel profile fetched successfully"
      )
    );
});

/**
 * @description Get watch history
 * @route GET /api/users/watch-history
 * @access Private - only logged in user can access this route
 * @returns { message, data, error }
 */
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["User not found"]));
  }

  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(
        RESPONSE_STATUS_CODE.SUCCESS,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
