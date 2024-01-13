import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded on Cloudinary
    console.log("File uploaded on Cloudinary", response.url);

    return response;
  } catch (error) {
    // remove the locally saved temp file as the upload operation failed
    fs.unlinkSync(localFilePath);

    return null;
  }
};

export { uploadOnCloudinary };
