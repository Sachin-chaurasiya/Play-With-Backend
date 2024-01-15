import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  // find all comments for the video
  // paginate the results
  const comments = await Comment.find({ video: videoId })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Comment.countDocuments({ video: videoId });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    {
      comments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    },
    "Comments fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { content } = req.body;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  if (!content) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Content is required"])
      );
  }

  // create a new comment
  const comment = await Comment.create({
    owner: req.user?._id,
    content,
    video: videoId,
  });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.CREATED,
    comment,
    "Comment added successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.CREATED).json(response);
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Comment ID is required",
        ])
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

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    updatedComment,
    "Comment updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Comment ID is required",
        ])
      );
  }

  // delete the comment
  await Comment.findByIdAndDelete(commentId);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Comment deleted successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export { getVideoComments, addComment, updateComment, deleteComment };
