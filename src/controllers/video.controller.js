import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy="createdAt", sortType="asc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const sortByArr=["createdAt","duartion"]
    const sortTypeArr=["dsc","asc"]

    if (!sortByArr.includes(sortBy) || !sortTypeArr.includes(sortType)) {
        throw new ApiError(400, "Please send valid fields for sortBy or sortType");
    }
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video=  Video.aggregate([
        {
            $match:
            {
                $or:[
                    {
                        owner: userId ? new mongoose.Types.ObjectId(userId) : null,
                        isPublished:  true, 
                    },
                    {
                        $and:[
                            {
                                isPublished:true
                            },
                            {
                                $or:[
                                    {
                                        title: query?{$regex:query,$options:"i"}:{$exists:true}
                                    },
                                    {
                                        description: query?{$regex:query,$options:"i"}:null
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
        },
        {
            $lookup:
            {
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            },
        },
        {
            $sort:{
                [sortBy]:sortType==="dsc"?-1:1
            },

        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    const result= await Video.aggregatePaginate(video,{
        page,
        limit,
        customLabels:{
            totalDocs: "totalVideos",
            docs: "Videos"
        },
        allowDiskUse:true
    })

    if (result.totalVideos === 0) {
        throw new ApiError(404, "Videos not found");
      }
    
      return res
        .status(200)
        .json(new ApiResponse(200,"Videos fetched successfully", result));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,isPublished = true} = req.body

    if (
        [title, description].some((field) => field?.trim() === "")
    ) 
    {
        throw new ApiError(400, "title and description required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    
    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both Files  are required")
    }

    const videoFileCld = await uploadOnCloudinary(videoLocalPath)
    const thumbnailCld = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFileCld || !thumbnailCld) {
        throw new ApiError(500, "video or thubnail not uploded on cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        isPublished: isPublished,
        duration:videoFileCld.duration,
        videoFile:videoFileCld.url,
        thumbnail:thumbnailCld.url,
        views:0,
        owner: req.user?._id
    })

    if(!video){
        throw new ApiError(500,"video not published succesfully")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(201,"video Published successfully",video)
           )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"videoid is mandatory")
    }

    const userId =req.user?.id;

    try {
        // Find the user by userId and update their watchHistory
        const result = await User.findByIdAndUpdate(
            userId, // User ID
            { $addToSet: { watchHistory: videoId } }, // Add videoId to watchHistory if it doesn't already exist
            { new: true, useFindAndModify: false } // Return the updated document and avoid using the deprecated findAndModify method
        );

    } catch (error) {
        console.error('Error updating watch history:', error);
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 },
      });
    
      if (!updatedVideo) {
        throw new ApiError(400, "Video not found");
      }

      const video = await Video.aggregate([
        {
          $match: {
            _id: videoId ? new mongoose.Types.ObjectId(videoId) : null,
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $lookup: {
                  from: "subscriptions",
                  localField: "_id",
                  foreignField: "channel",
                  as: "subscribers",
                },
              },
              {
                $addFields: {
                  subscribersCount: {
                    $size: "$subscribers",
                  },
                  isSubscribed: {
                    $cond: {
                      if: {
                        $in: [userId, "$subscribers.subscriber"],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
              {
                $project: {
                  fullName: 1,
                  username: 1,
                  avatar: 1,
                  subscribersCount: 1,
                  isSubscribed: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            likesOnVideo: {
              $size: "$likes",
            },
            owner: {
              $first: "$owner",
            },
            isLiked: {
              $cond: {
                if: { $in: [userId, "$likes.likedBy"] },
                then: true,
                else: false,
              },
            },
          },
        },
      ]);
    
      if (video.length < 1) {
        throw new ApiError(404, "Video not found");
      }
    
      return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const {title,description} = req.body;

    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID");
      }

    if (!title && !description ) 
    {
        throw new ApiError(400, "title and description required")
    }
    
    if (!thumbnailLocalPath) {
       const video= await Video.findOneAndUpdate(
        {_id:videoId,owner:req.user?._id},
        {
            $set:{
            title,
            description}
        },
        {new:true}
       )

       if(!video){
        throw new ApiError(500,"error while updating a video")
       }

       return res
            .status(200)
            .json(
                new ApiResponse(200,"title and description updated",video)
            )
    }
    else{

        const thumbnailCld = await uploadOnCloudinary(thumbnailLocalPath)
    
        if ( !thumbnailCld) {
            throw new ApiError(500, "thubnail not uploded on cloudinary")
        }

        const video= await Video.findOneAndUpdate(
            {_id:videoId,owner:req.user?._id},
            {
                $set:{
                title,
                description,
                thumbnail:thumbnailCld.url
                }
            },
            {new:true}
           )
    
           if(!video){
            throw new ApiError(500,"error while updating a video")
           }
    
           return res
                .status(200)
                .json(
                    new ApiResponse(200,"title,thumbnail and description updated",video)
                )
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID");
      }

      const video = await Video.findOneAndDelete({
        _id: videoId,
        owner: req.user._id,
      });
    
      if (!video) {
        throw new ApiError(
          400,
          "Video not found or you are not the owner of this video"
        );
      }
    
      return res
        .status(200)
        .json(new ApiResponse(200,  "Video deleted successfully",{}));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");
  
    const video = await Video.findOne({
      _id: videoId,
      owner: req.user._id,
    });
  
    if (!video) {
      throw new ApiError(400, "Video not found or you are not the owner");
    }
  
    // Toggle the isPublished field
    video.isPublished = !video.isPublished;
  
    // Save the updated video
    const updatedVideo = await video.save({ validateBeforeSave: false });
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `Video successfully ${
            updatedVideo.isPublished ? "Published" : "Unpublished"
          }`,
          {}
         
        )
      );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}