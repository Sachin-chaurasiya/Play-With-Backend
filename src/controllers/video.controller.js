import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      return res
        .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
        .json(
          new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Invalid user ID"])
        );
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(videoAggregate, options);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    videos,
    "Videos fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Video file and thumbnail are required",
        ])
      );
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);

  if (!videoFile) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Error while uploading video file",
        ])
      );
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Error while uploading thumbnail",
        ])
      );
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.secure_url,
    thumbnail: thumbnail.secure_url,
    duration: videoFile.duration,
    owner: req.user?._id,
  });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    video,
    "Video published successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  const video = await Video.findById(videoId).populate("owner");

  if (!video) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Video not found"]));
  }

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    video,
    "Video fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  if (!title && !description && !thumbnailLocalPath) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Nothing to update"])
      );
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    return res
      .status(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.INTERNAL_SERVER_ERROR, [
          "Error while uploading thumbnail",
        ])
      );
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title, description, thumbnail: thumbnail.secure_url } },
    { new: true }
  );

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    video,
    "Video updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  await Video.findByIdAndDelete(videoId);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Video deleted successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Video ID is required"])
      );
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Video not found"]));
  }

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Video publish status updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
