import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { EMAIL_REGEX, RESPONSE_STATUS_CODE } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
