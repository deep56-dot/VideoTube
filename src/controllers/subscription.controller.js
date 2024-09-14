import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(! isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id")
    }

    if(req.user?.id === channelId){
        throw new ApiError(400,"you can not subscribe your own channel")
    }

    const UnsubscribeChannel=   await Subscription.findOneAndDelete(
        {channel:channelId,subscriber:req.user?._id}
    )

    if(!UnsubscribeChannel){
        const Subscribe= await Subscription.create({
            subscriber:req.user?._id,
            channel:channelId
        })

        if(!Subscribe){
            throw new ApiError(500,"error while subscribing a channel")
        }
    }

    return res
           .status(200)
           .json(new ApiResponse(
            201,
            "Channel Subscription Toggled",
            {}
           ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(! isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:channelId?new mongoose.Types.ObjectId(channelId):null
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            createdAt: 1,
                        }
                    }
                  ]
            }
        },
        {
          $unwind:"$subscribers"
        },
        {
          $group:{
            _id:"$channel",
            subscribersOfChannel:{
              $push:"$subscribers"
            }
          }
        },
        {
            $addFields: {
              subscribersCount: {
                $size: "$subscribersOfChannel",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribersOfChannel._id"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              subscribersOfChannel: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ]);
        if (subscribers.length < 1) {
          throw new ApiError(404, "Channel has no subscribers yet");
        }
      
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "Channel subscribers fetched successfully",
              subscribers[0],
            )
          );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }
  
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",  // Rename the result array to be more descriptive
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channels",  // Unwind to get each channel separately
    },
    {
      $group: {
        _id: "$subscriber",  // Group by the subscriber (user ID)
        subscribedToChannels: { $push: "$channels" },  // Push all channels into an array
      },
    },
    {
      $project: {
        _id: 0,  // Exclude the _id field from the result
        subscribedToChannels: 1,  // Include only the subscribed channels
      },
    },
  ]);
  
  if (!channels.length) {
    throw new ApiError(404, "Channel does not exist");
  }
  
  console.log("channels", channels);
  
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User channels fetched successfully",
        channels[0].subscribedToChannels // No need for map() now, just return the array
      )
    );
  
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}