import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is invalid"])
      );
  }

  const userId = req.user?._id;

  const like = await Like.findOne({ video: videoId, likedBy: userId });

  if (like) {
    await like.remove();
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
  }

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Like toggled successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Comment ID is invalid",
        ])
      );
  }

  const userId = req.user?._id;

  const like = await Like.findOne({ comment: commentId, likedBy: userId });

  if (like) {
    await like.remove();
  } else {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });
  }

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Like toggled successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Tweet ID is invalid"])
      );
  }

  const userId = req.user?._id;

  const like = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (like) {
    await like.remove();
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likes = await Like.find({ likedBy: userId }).populate("video");

  const videos = likes.map((like) => like.video);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    videos,
    "Liked videos fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
