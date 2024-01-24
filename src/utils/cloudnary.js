import {v2 as cloudinary} from "cloudinary"
import exp from "constants";
import fs from "fs"


           
cloudinary.config({ 
  cloud_name: 'process.env.CLOUDINAY_NAME', 
  api_key: 'process.env.CLOUDINAY_API_KEY', 
  api_secret: 'process.env.CLOUDINAY_API_SECRET' 
});

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if (!localFilePath) {
            return null
        }
        //upload file on cloudinary
       const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been upload successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response;
    }
    catch(error){
          fs.unlinkSync(localFilePath) // remove the locally saved temporary as the upload operation got failed 
          return null;
    }
}

export {cloudinary}





cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });