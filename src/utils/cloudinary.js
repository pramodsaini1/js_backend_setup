import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file system nodejs ke sath bydefault aati hai

cloudinary.config({
  cloud_name: process.env.CLOUDINAY_NAME,
  api_key: process.env.CLOUDINAY_API_KEY=393793266429238 ,
  api_secret: process.env.CLOUDINAY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    

    fs.unlinkSync(localFilePath);

    return response;
    
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};
export { uploadOnCloudinary };
//
