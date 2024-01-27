import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asyncHandler(async (req,res)=>{
     //get user details from frontend
     //validation -not empty
     // check if user already exist;username,email
     //check for images.check for avtar
     //upload them cloudinary,avtar
     //create user object-create entry in db
     //remove password and refresh token field from response
     //check  for user creation 
     //return res


     const  {fullName,email,username,password}=req.body
     console.log("email",email);
    
     if(
        [fullName,email,username,password].some((field)=>field?.trim()=="")
     ){
        throw new ApiError(400,"All fields are required")
     }

    const existUser= User.findOne({
        $or:[{username},{email}]
     })

     if ( existUser) {
        throw new ApiError(409,"User with email or username already exist")
     }

    const avtarLocalPATH= req.files?.avtar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avtarLocalPATH){
        throw new ApiError(400,"Avtar image is required")
    }

   const avtar=await uploadOnCloudinary(avtarLocalPATH)
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if (!avtar) {
      throw new ApiError(400,"Avtar image is required")
   }
   const user=await User.create({
    fullName,
    avtar:avtar.url,
    coverImage:coverImage?.url ||"",
    email,
    password,
    username:username.toLowerCase()
   })

   const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if (!createdUser) {
      throw new ApiError(500,"Something went wrong when registraing user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
   )

})



export {
    registerUser,
}