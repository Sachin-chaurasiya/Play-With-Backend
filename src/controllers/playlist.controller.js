import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Name is required"])
      );
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.CREATED,
    playlist,
    "Playlist created successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.CREATED).json(response);
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["User ID is invalid"])
      );
  }

  const playlists = await Playlist.find({ owner: userId });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    playlists,
    "Playlists fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Playlist ID is required",
        ])
      );
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        owner: 0,
      },
    },
  ]);

  if (!playlist.length) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Playlist not found"])
      );
  }

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    playlist[0],
    "Playlist fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !playlistId ||
    !videoId ||
    !isValidObjectId(playlistId) ||
    !isValidObjectId(videoId)
  ) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Playlist ID and Video ID should be valid",
        ])
      );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Playlist not found"])
      );
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Video not found"]));
  }

  await Playlist.updateOne({ _id: playlistId }, { $push: { videos: videoId } });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Video added to playlist successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !playlistId ||
    !videoId ||
    !isValidObjectId(playlistId) ||
    !isValidObjectId(videoId)
  ) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Playlist ID and Video ID should be valid",
        ])
      );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Playlist not found"])
      );
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res
      .status(RESPONSE_STATUS_CODE.NOT_FOUND)
      .json(new ApiError(RESPONSE_STATUS_CODE.NOT_FOUND, ["Video not found"]));
  }

  await Playlist.updateOne({ _id: playlistId }, { $pull: { videos: videoId } });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Video removed from playlist successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Playlist ID is required",
        ])
      );
  }

  await Playlist.findByIdAndDelete(playlistId);

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Playlist deleted successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Playlist ID is invalid",
        ])
      );
  }

  if (!name) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, ["Name is required"])
      );
  }

  const playlist = await Playlist.findByIdAndUpdate(playlistId, {
    $set: { name, description },
  });

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    playlist,
    "Playlist updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
