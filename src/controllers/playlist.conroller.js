import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const createPlaylist= asyncHandler( async(req,res)=>{

    const { name, description } = req.body;

    if (!name || !description) {
      throw new ApiError(400, "name and description are required");
    }

    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });

    if (!playlist) {
      throw new ApiError(500, "Error while creating playlist");
    }

    return res
      .status(200)
      .json(new ApiResponse(201,"Playlist created successfully",playlist));
})

const getPlaylistById = asyncHandler(async (req,res)=>{

  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findOne({ _id: playlistId }).populate({
    path: "videos",
    populate: { path: "owner", select: "username fullname avatar" },
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully", playlist));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid UserId");
    }

    const playlists = await Playlist.find({
      owner: userId ? userId : null,
    })
    .populate({
      path: "videos",
      populate: { path: "owner", select: "username fullname avatar" },
    });

    if (!playlists) {
      throw new ApiError(400, "No playlists found for the user");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Playlists fetched successfully", playlists));
});

const addVideoToPlaylist= asyncHandler(async(req,res)=>{

    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Id");
    }

    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user._id,
      },
      {
        $addToSet: {
          videos: videoId,
        },
      },
      { new: true }
    );

    if (!playlist) {
      throw new ApiError(500, "Error while adding to playlist");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Successfully added to the playlist",playlist));
})

const removeVideoFromPlaylist= asyncHandler(async(req,res)=>{
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Id");
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
          _id: playlistId,
          owner: req.user._id,
        },
        {
          $pull: {
            videos: videoId,
          },
        },
        { new: true }
      );
  
      if (!playlist) {
        throw new ApiError(500, "Error while removing video from playlist");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, "Successfully removed video from the playlist",playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {

    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid PlaylistId");
    }

    const deletedPlaylist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user?._id,
    });

    if (!deletedPlaylist) {
      throw new ApiError(500, "Unable to delete, please try later");
    }

    return res
           .status(200)
           .json(new ApiResponse(200,"Deleted successfully", {}));
});

const updatePlaylist = asyncHandler( async(req,res)=> {

  const { playlistId } = req.params;

  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name or description missing");
  }

  const playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new ApiError(
      400,
      "You are not the owner of the playlist or playlist not found"
    );
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully updated", playlist));
})

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}


