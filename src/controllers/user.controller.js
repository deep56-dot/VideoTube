import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadCloudinaryFile } from "../utils/cloudinary.js";




const registerUser = asyncHandler(async (req,res)=>{
   // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username,fullname,email,password} = req.body;

    if(
        [username,fullname,email,password].some((field)=>{
            field?.trim()===""
        })
    ){
        throw new ApiError(400,"All Fields are Mandatory No Field Should be empty")
    }

    const existedUser= await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"username or password already exits");
    }

    console.log("existed user ",existedUser)

    const avatarLocalPath = req.files?.avatar[0]?.path

    //below will give error in future beacuse not mandatory so it become undefined and we cant find property of undefined
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    //solution for above is shown below
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log("req.files ",req.files)
    console.log("req.files?.avatar[0] ",req.files?.avatar)


    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required");
    }

    const avatar = await uploadCloudinaryFile(avatarLocalPath)
    const coverImage = await uploadCloudinaryFile(coverImageLocalPath)

    console.log("avatar ",avatar)
    console.log("coverImage ",coverImage)



    if(!avatar){
        throw new ApiError(400,"avatar file is required");
    }

    const user= await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,
        username: username.toLowerCase(),
        email
    })

    const createdUser = await User.findById(user._id).select(" -password -refreshToken")

    return res.status(201).json(
        new ApiResponse(200,"User Registered succesfully",createdUser)
    )

})

export {registerUser}