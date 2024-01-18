import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RESPONSE_STATUS_CODE } from "../constants.js";
import { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Channel ID is invalid",
        ])
      );
  }

  const subscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
  } else {
    await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
  }

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    null,
    "Subscription updated successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Channel ID is not valid",
        ])
      );
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "-refreshToken -password -createdAt -updatedAt -__v -watchHistory"
  );

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    subscribers,
    "Subscribers fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    return res
      .status(RESPONSE_STATUS_CODE.BAD_REQUEST)
      .json(
        new ApiError(RESPONSE_STATUS_CODE.BAD_REQUEST, [
          "Subscriber ID is not valid",
        ])
      );
  }

  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate(
    "channel",
    "-refreshToken -password -createdAt -updatedAt -__v -watchHistory"
  );

  const response = new ApiResponse(
    RESPONSE_STATUS_CODE.SUCCESS,
    subscriptions,
    "Subscriptions fetched successfully"
  );

  return res.status(RESPONSE_STATUS_CODE.SUCCESS).json(response);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
