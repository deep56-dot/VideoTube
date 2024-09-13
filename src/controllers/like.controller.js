import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        new ApiError(400,"invalid video id")
    }

    const deleteVideoLike = await Like.findByIdAndDelete(
        {video:videoId , }
    )
})

const toggleCommentLike = asyncHandler(async(req,res)=>{

}) 

const getAllLikedVideos = asyncHandler(async(req,res)=>{

}) 

export {toggleVideoLike,toggleCommentLike,getAllLikedVideos}