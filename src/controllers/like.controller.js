import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/ApiResponse";


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"invalid video id")
    }

    const deleteVideoLike = await Like.findOneAndDelete(
        {video:videoId,likedBy:req.user?._id}
    )

    if(!deleteVideoLike){
        const like= await Like.create(
            {
                video:videoId,
                likedBy:req.user?._id
            }
        )
        if(!like){
            return new ApiError(500,"error while like video")
        }
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                "toggle like successful",
                {}
            )
           )
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        return new ApiError(400,"invalid comment id")
    }

    const deleteCommentLike = await Like.findOneAndDelete(
        {comment:commentId,likedBy:req.user?._id}
    )

    if(!deleteCommentLike){
        const like= await Like.create(
            {
                comment:commentId,
                likedBy:req.user?._id
            }
        )
        if(!like){
            return new ApiError(500,"error while like comment")
        }
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                "toggle like successful",
                {}
            )
           )
}) 

const getAllLikedVideos = asyncHandler(async(req,res)=>{
    let videos= await Like.aggregate([
        {
            $match:{
                likedBy:req.user?._id,
                video:{exists:true}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fusername: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            $first:"$owner"
                        }
                    }
                ]
            }
        }
    ])

    if(!videos){
        return ApiError(500,"error while fetching liked videos")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(
                200,
                "successfully fetched liked videos",
                videos
            )
           )
}) 

export {toggleVideoLike,toggleCommentLike,getAllLikedVideos}