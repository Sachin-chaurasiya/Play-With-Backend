import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "../logger.js";

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    // remove the file from the local storage
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    if (!publicId) return null;
    // delete the file from cloudinary
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Error while deleting file from cloudinary: ${error}`);
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const tokens = url.split("/");
  const publicIdWithExtension = tokens[tokens.length - 1];
  const publicId = publicIdWithExtension.split(".")[0];
  return publicId;
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
