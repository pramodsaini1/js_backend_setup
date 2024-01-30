import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registeruser = asyncHandler(async (req, res) => {
  // res.status(200).json({ message: "Krishan Surela" });

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

export { registeruser };