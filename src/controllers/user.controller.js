import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessAndRefreshTokens=async (userId)=>{
      try{
            const user=await User.findById(userId)
           const refreshToken= user.generateRefreshToken()
           const accessToken= user.generateAccessToken()

           user.refreshToken=refreshToken
          await user.save({validateBeforeSave:false})

          return {accessToken,refreshToken}


      }
      catch(error){
           throw new ApiError(500,"Something went wrong while generation access and refresh token")
      }
}
const registeruser = asyncHandler(async (req, res) => {
 
  // get user details from frontend throw postman
  // validation -not empty
  // check if user already exists:username,email
  // check for images ,check for avator
  // upload them to cloudinary ,check avatar on cloudinary
  // create user object - create entry in DB
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullname, email, username, password } = req.body;
   
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    //  ?. = optional operator
    throw new ApiError(400, "All fields are Required");
  }
 

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //multer hme req.files ka access deta hai ,jaise express req.body deta hai
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; jab postman pe coverimage field nahi lete hai to error aati hai esse

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avator File is Required");
  }
 
  const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 
  if (!avatar) {
    throw new ApiError(400, "Avator File is Required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //const createdUser =await User.findById(user._id) //check entry is gone or not in DB

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went Wrong while registering the user");
  }
  // console.log(res);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser=asyncHandler(async (req,res)=>{
    // req body------data
    // username or email
    //find the user
    //password check
    //access and refresh token
    //send the cookie

    const {email,username,password}=req.body

    if(!(username ||email)){
         throw new ApiError(400,"username or  email is required")
    }


   const user=await  User.findOne({
      $or:[{username},{email}]
    })

    if(!user){
      throw new ApiError(404,"User does not exits")
    }


    const isPasswordValid = await user.isPasswordCorrect(password);
     
    
    if(!isPasswordValid){
      throw new ApiError(401," user Password incorrect")
    }

   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

  const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
     new ApiResponse(200,
      {
         user:loggedInUser,accessToken,refreshToken
     },
     "User logged In SuccessFully"
     )
  )


})


const logoutUser=asyncHandler(async (req,res)=>{
      await User.findByIdAndUpdate(
          req.user._id,
          {
            $set:{
              refreshToken:undefined
            }
          },{
            new:true
          }
       )

       const options={
           httpOnly:true,
           secure:true
       }

       return res
       .status(200)
       .clearCookie("accessToken",options)
       .clearCookie("refreshToken",options)
       .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
   const incommingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

   if(!incommingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
   }
try {
  
    const decodedToken= jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
     )
  
    const user=await User.findById(decodedToken?._id)
  
    if (!user) {
         throw new ApiError(401,"Invalid refresh Token")
    }
  
    if(incommingRefreshToken!==user?.refreshToken){
      throw new ApiError(401," refresh Token is expired or used")
    }
  
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "Access token refreshed"
      )
    )
  
} catch (error) {
     throw new ApiError(401,error?.message || "invalid refresh token")
}
})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
      const {oldPassword,newPassword}=req.body

       const user=await User.findById(req.user?._id)
      const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

      if(!isPasswordCorrect){
           throw new ApiError(400,"Invalid Old Password")
      }

      user.password=newPassword

     await user.save({validateBeforeSave:false})

     return res
     .status(200)
     .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
      return res
      .status(200)
      .json(new ApiResponse(200,req.user,"current User fetched Succesfully"))
})


const updateAccountDetails=asyncHandler(async (req,res)=>{
     const {fullname,email}=req.body

     if(!fullname ||!email){
         throw new ApiError(401,"All Fields are required")
     }

    const user=  User.findByIdAndUpdate
      (req.user?._id,
        {
          $set:{
            fullname,
            email:email
          }
        },
        {new:true}
      
      
      
      ).select("-password")


      return res
      .status(200)
      .json(new ApiResponse(200,user,"Account details updated Successfully"))
})


const updateUserAvatar=asyncHandler(async (req,res)=>{
        const avatarLocalPath=  req.file?.path
        
        if(!avatarLocalPath){
             throw new ApiError(400,"Avatar is missing")
        }

       const avatar= await uploadOnCloudinary(avatarLocalPath)

       if(!avatar.url){
           throw new ApiError(400,"Error while uploading on avatar")
       }

      const user= await User.findByIdAndUpdate(
        req.user._id,
        {
          $set:{
             avatar:avatar.url
          }
        },
        {new:true}
        
        ).select("-password")


        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})

const updateUserCoverImage=asyncHandler(async (req,res)=>{
    
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
          throw new ApiError(400,"Cover Image is Missing")
    }

    const coverImage=uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover Image")
    }

   const user= await user.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
           coverImage:coverImage.url
        }
      },
      {new:true}
      
      ).select("-password")


      return res
      .status(200)
      .json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
})



const getUserChannelProfile=asyncHandler(async(req,res)=>{
     const {username} =req.params
   // for subscription ----- count the channel
   //for channel -------> count the channel
     if(!username?.trim()){
          throw new ApiError(400,"username is missing")
     }
// aggregation pipeline---->mongo db aggregation pipeline refers to the flow of the operaion that process,transform,and return result
// Input -> $match -> $group -> $sort -> output

    const channel=await User. aggregate([
      {
        $match:{
             username:username?.toLowerCase()
        }
      },
      {//for subscribe
        $lookup:{
           from:"Subscription",
           localField:"_id",
           foreignField:"channel",
           as:"subscribers"
        }
      },
      {//for channel
        $lookup:{
          from:"Subscription",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        }
      },
      {//combine of the both fields
        //count the subscribe and channel
        $addFields:{
          subscribersCount:{
               $size:"$subscribers"
          },
          channelSubscribedToCount:{
              $size:"$subscribedTo"
          },
          //for check that subscribe or not
          isSubscribed:{
              $cond:{
                   if:{$in:[req.user?._id,"$subscribers.$subscriber"]},
                   then:true,
                   else:false
              }
          }
        }
      },
      {
        // send the full details
        $project:{
            fullname:1,
            username:1,
            subscribersCount:1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
      }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exits");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

const getWatchHistory=asyncHandler(async (req,res)=>{
    const user=await User.aggregate([
       {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
       },
       {
            $lookup:{
              from:"videos",
              localField:"watchHistory",
              foreignField:"_id",
              as:"watchHistory",
              pipeline:[
                  {
                    $lookup:{
                        from:"user",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                          {
                            $project:{
                              fullname:1,
                              username:1,
                              avatar:1,

                            }
                          }
                        ]
                    }
                  },
                  {
                    $addFields:{
                         owner:{
                             $first:"$owner"
                         }
                    }
                  }
              ]
            }
       }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].getWatchHistory,"Watch History Fetched Successfully"))
})





export { 
  registeruser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
 };