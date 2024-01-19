import { RESPONSE_STATUS_CODE } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (_, res) => {
  return res
    .status(RESPONSE_STATUS_CODE.SUCCESS)
    .json(
      new ApiResponse(RESPONSE_STATUS_CODE.SUCCESS, null, "Everything is OK!")
    );
});

export { healthCheck };
