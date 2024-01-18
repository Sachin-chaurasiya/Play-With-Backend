import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";
import { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Content is required"])
      );
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.CREATED,
    tweet,
    "Tweet created successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.CREATED).json(response);
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["User ID is invalid"])
      );
  }

  const tweets = await Tweet.find({ owner: userId });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    tweets,
    "Tweets fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Tweet ID is invalid"])
      );
  }

  const { content } = req.body;

  if (!content) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Content is required"])
      );
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    tweet,
    "Tweet updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Tweet ID is invalid"])
      );
  }

  await Tweet.findByIdAndDelete(tweetId);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Tweet deleted successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
